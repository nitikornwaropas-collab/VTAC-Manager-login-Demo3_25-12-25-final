import React, { useState } from 'react';
import { User, UserRole, SportType, Team } from '../types';
import { MOCK_TEAMS, MOCK_USERS, generateMemberId } from '../constants';

interface AuthFlowProps {
  onComplete: (user: User, team: Team) => void;
}

// Steps in the onboarding journey
enum Step {
  REGISTER = 0,
  ROLE_SELECT = 1,
  TEAM_SETUP = 2, // For Coach & Manager
  TEAM_JOIN = 3,   // For Player
  LOGIN = 4
}

const AuthFlow: React.FC<AuthFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>(Step.REGISTER);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    sport: SportType.FOOTBALL,
  });
  const [user, setUser] = useState<User | null>(null);
  const [teamCode, setTeamCode] = useState('');
  const [createdTeamName, setCreatedTeamName] = useState('');
  const [error, setError] = useState('');

  // --- LOGIC SIMULATION ---

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.fullName) {
      setError('Please fill in all fields');
      return;
    }
    
    // Simulate creating user in Firestore
    const newUser: User = {
      id: 'user_' + Date.now(),
      uid: 'user_' + Date.now(),
      name: formData.fullName,
      fullName: formData.fullName,
      email: formData.email,
      role: UserRole.Unassigned,
      sportType: formData.sport,
      status: 'active',
      memberId: generateMemberId(formData.fullName)
    };
    
    setUser(newUser);
    setStep(Step.ROLE_SELECT);
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
        setError('Please enter email and password');
        return;
    }

    // --- REAL AUTHENTICATION AGAINST MOCK DATA ---
    const foundUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === formData.email.toLowerCase() && u.password === formData.password
    );
    
    if (!foundUser) {
      setError('Invalid email or password.');
      return;
    }
    
    // Store user in state so handleJoinTeam can access it
    setUser(foundUser);

    // IF PLAYER OR PARENT -> FORCE TEAM CODE ENTRY BEFORE COMPLETING LOGIN
    if (foundUser.role === UserRole.Player || foundUser.role === UserRole.Parent) {
        // Use the team ID from the user record if it exists, otherwise prompt for join.
        // For the demo data, all players/parents have a teamId.
        const userTeam = MOCK_TEAMS.find(t => t.id === foundUser.teamId);
        if (userTeam) {
          onComplete(foundUser, userTeam);
        } else {
          // Fallback if user has no teamId - prompt to join
          setStep(Step.TEAM_JOIN);
        }
        return;
    }
    
    // IF COACH OR MANAGER -> LOGIN DIRECTLY
    // Find the primary team for this coach/manager from mock data
    const primaryTeam = MOCK_TEAMS.find(t => t.id === foundUser.teamId) || MOCK_TEAMS[0];

    onComplete(foundUser, primaryTeam);
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
      // Simulation
      const name = provider === 'google' ? 'Google User' : 'Apple User';
      const role = UserRole.Coach; // Defaulting to Coach for easy demo access
      const mockUser: User = {
          id: `user_${provider}_${Date.now()}`,
          uid: `user_${provider}_${Date.now()}`,
          name: name,
          fullName: name,
          email: `${provider}@example.com`,
          role: role,
          status: 'active',
          sportType: SportType.FOOTBALL,
          imageUrl: provider === 'google' 
            ? 'https://ui-avatars.com/api/?name=Google+User&background=DB4437&color=fff' 
            : 'https://ui-avatars.com/api/?name=Apple+User&background=000&color=fff',
          memberId: generateMemberId(name)
      };
      
      const mockTeam = MOCK_TEAMS[0];
      onComplete(mockUser, mockTeam);
  };

  const handleRoleSelect = (role: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    
    if (role === UserRole.Coach || role === UserRole.Manager) {
      setStep(Step.TEAM_SETUP);
    } else { // Catches Player and Parent
      setStep(Step.TEAM_JOIN);
    }
  };

  const generateTeamCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdTeamName || !user) return;

    const newCode = generateTeamCode();
    
    const newTeam: Team = {
      id: 'team_' + Date.now(),
      name: createdTeamName,
      code: newCode,
      coachId: user.id,
      sport: user.sportType || SportType.FOOTBALL,
      ageGroup: 'U14', 
      members: [user.id]
    };

    onComplete(user, newTeam);
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamCode.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }
    if (!user) return;

    // 1. Try to find an existing mock team that matches the code
    const existingTeam = MOCK_TEAMS.find(t => t.code === teamCode);

    if (existingTeam) {
        // Link user to this team
        const updatedUser = { ...user, teamId: existingTeam.id };
        onComplete(updatedUser, existingTeam);
    } else {
        // Fallback for codes not in mock data (create a dummy session team)
        const mockTeam: Team = {
          id: 'team_joined_' + Date.now(),
          name: 'FC Demo United',
          code: teamCode,
          coachId: 'coach_123',
          sport: user.sportType || SportType.FOOTBALL,
          ageGroup: 'U18',
          members: ['coach_123', user.id]
        };
        
        // Link user to this mock team
        const updatedUser = { ...user, teamId: mockTeam.id };
        onComplete(updatedUser, mockTeam);
    }
  };

  // --- RENDER HELPERS ---

  const SocialButtons = () => (
    <div className="animate-fade-in">
        <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-indigo-500/20 flex-1" />
            <span className="text-xs text-indigo-300/50 font-bold uppercase tracking-wider">Or continue with</span>
            <div className="h-px bg-indigo-500/20 flex-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
             <button
                type="button"
                className="flex items-center justify-center gap-3 bg-white text-gray-900 py-3 rounded-lg transition-all group shadow-sm hover:shadow-md hover:bg-gray-100"
                onClick={() => handleSocialLogin('google')}
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                <span className="text-sm font-bold">Google</span>
            </button>
            
             <button
                type="button"
                 className="flex items-center justify-center gap-3 bg-black text-white py-3 rounded-lg transition-all group shadow-sm hover:shadow-md border border-white/20 hover:bg-gray-900"
                 onClick={() => handleSocialLogin('apple')}
            >
                <i className="fab fa-apple text-xl text-white"></i>
                <span className="text-sm font-bold">Apple</span>
            </button>
        </div>
    </div>
  );

  const renderRegister = () => (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 text-center">
        Create VTAC Account
      </h2>
      <p className="text-indigo-200/60 text-center mb-8 text-sm">Join the next generation of sports management</p>
      
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">Full Name</label>
          <input 
            type="text" 
            required
            placeholder="John Doe"
            className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-indigo-300/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            value={formData.fullName}
            onChange={e => setFormData({...formData, fullName: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">Email Address</label>
          <input 
            type="email" 
            required
            placeholder="you@example.com"
            className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-indigo-300/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">Primary Sport</label>
          <div className="relative">
            <select 
                className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                value={formData.sport}
                onChange={e => setFormData({...formData, sport: e.target.value as SportType})}
            >
                <option value={SportType.FOOTBALL}>Football (Soccer)</option>
                <option value={SportType.BASKETBALL}>Basketball</option>
                <option value={SportType.HOCKEY}>Hockey</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-400">
                <i className="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-600/30 border border-white/10">
          Get Started
        </button>
      </form>
      
      <SocialButtons />

      <div className="mt-6 flex justify-center">
        <button 
            onClick={() => {
                setError('');
                setStep(Step.LOGIN);
            }} 
            className="text-sm text-indigo-300 hover:text-white transition flex items-center gap-2 group"
        >
            Already have an account? <span className="text-purple-400 font-bold group-hover:text-purple-300 underline decoration-purple-500/50 decoration-2 underline-offset-4">Login</span>
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 text-center">
        Welcome Back
      </h2>
      <p className="text-indigo-200/60 text-center mb-8 text-sm">Log in to access your tactical board</p>
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">Email Address</label>
          <input 
            type="email" 
            required
            placeholder="you@example.com"
            className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-indigo-300/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">Password</label>
            <button
                type="button"
                onClick={() => alert('In a real application, a password reset link would be sent to your email address.')}
                className="text-xs text-indigo-400 hover:text-white transition-colors"
            >
                Forgot Password?
            </button>
          </div>
          <input 
            type="password" 
            required
            placeholder="••••••••"
            className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-indigo-300/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-600/30 border border-white/10">
          Login
        </button>
      </form>
      
      <SocialButtons />

      <div className="mt-6 flex justify-center">
        <button 
            onClick={() => {
                setError('');
                setStep(Step.REGISTER);
            }} 
            className="text-sm text-indigo-300 hover:text-white transition"
        >
            Don't have an account? <span className="text-purple-400 font-bold group-hover:text-purple-300 underline decoration-purple-500/50 decoration-2 underline-offset-4">Sign Up</span>
        </button>
      </div>
    </div>
  );

  const renderRoleSelect = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Choose your path</h2>
      <div className="grid grid-cols-1 gap-4">
        
        {/* Manager Button */}
        <button 
          onClick={() => handleRoleSelect(UserRole.Manager)}
          className="group relative p-6 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-emerald-500/50 rounded-xl transition-all text-left overflow-hidden"
        >
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">Manager</h3>
              <p className="text-sm text-indigo-300/70 mt-1 group-hover:text-indigo-200">Administer club, staff & finances.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-300">
                <i className="fas fa-briefcase text-emerald-400 group-hover:text-white text-xl"></i>
            </div>
          </div>
        </button>

        {/* Coach Button */}
        <button 
          onClick={() => handleRoleSelect(UserRole.Coach)}
          className="group relative p-6 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-purple-500/50 rounded-xl transition-all text-left overflow-hidden"
        >
           <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">Coach</h3>
              <p className="text-sm text-indigo-300/70 mt-1 group-hover:text-indigo-200">Create tactics, manage roster & drills.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all duration-300">
                <i className="fas fa-clipboard-list text-purple-400 group-hover:text-white text-xl"></i>
            </div>
          </div>
        </button>

        {/* Player Button */}
        <button 
          onClick={() => handleRoleSelect(UserRole.Player)}
          className="group relative p-6 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-blue-500/50 rounded-xl transition-all text-left overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition">Player</h3>
              <p className="text-sm text-indigo-300/70 mt-1 group-hover:text-indigo-200">Join a team, view tactics & drills.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
                 <i className="fas fa-running text-blue-400 group-hover:text-white text-xl"></i>
            </div>
          </div>
        </button>
        
        {/* Parent Button */}
        <button 
          onClick={() => handleRoleSelect(UserRole.Parent)}
          className="group relative p-6 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-teal-500/50 rounded-xl transition-all text-left overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition">Parent</h3>
              <p className="text-sm text-indigo-300/70 mt-1 group-hover:text-indigo-200">Follow player progress, view schedule.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500 group-hover:scale-110 transition-all duration-300">
                 <i className="fas fa-users text-teal-400 group-hover:text-white text-xl"></i>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderTeamSetup = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-center text-white">Create Your Team</h2>
      <p className="text-indigo-300/60 text-center mb-6 text-sm">We'll generate a unique code for your squad.</p>
      
      <form onSubmit={handleCreateTeam} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">Team Name</label>
          <input 
            type="text" 
            placeholder="e.g. Westside Warriors"
            required
            className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-indigo-300/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            value={createdTeamName}
            onChange={e => setCreatedTeamName(e.target.value)}
          />
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200 flex gap-3">
          <i className="fas fa-info-circle mt-0.5 text-blue-400"></i>
          <span>After clicking "Create", you will receive a 6-digit code to share with your roster.</span>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-600/30 border border-white/10">
          Create & Generate Code
        </button>
      </form>
    </div>
  );

  const renderTeamJoin = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-center text-white">Access Your Team</h2>
      <p className="text-indigo-300/60 text-center mb-6 text-sm">Enter the 6-digit invite code from your coach.</p>
      
      <form onSubmit={handleJoinTeam} className="space-y-8">
        <div>
          <input 
            type="text" 
            placeholder="X7Y2Z9"
            required
            maxLength={6}
            className="w-full bg-indigo-950/40 border border-indigo-500/30 rounded-xl px-3 py-5 text-center text-4xl tracking-[0.2em] uppercase font-mono text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner placeholder-indigo-900/50"
            value={teamCode}
            onChange={e => setTeamCode(e.target.value.toUpperCase())}
          />
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-purple-600/30 border border-white/10">
          Access Team Hub
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[#0B0F19]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-md w-full mx-4 p-8 glass-panel rounded-2xl shadow-2xl relative z-10 border border-white/10">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/30 transform rotate-3 border border-white/20">V</div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm flex items-center gap-3">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {step === Step.REGISTER && renderRegister()}
        {step === Step.LOGIN && renderLogin()}
        {step === Step.ROLE_SELECT && renderRoleSelect()}
        {step === Step.TEAM_SETUP && renderTeamSetup()}
        {step === Step.TEAM_JOIN && renderTeamJoin()}
      </div>
    </div>
  );
};

export default AuthFlow;