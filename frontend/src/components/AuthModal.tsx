import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('BUYER');
  const [organization, setOrganization] = useState('');
  const [region, setRegion] = useState('Chennai');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectDemoAccount = (demoEmail: string) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          organization: organization.trim(),
          region: region.trim(),
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-4 py-12 text-[#202522]">
      <div className="w-full max-w-sm space-y-4">
        {/* Header Wordmark */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-9 w-9 rounded-[4px] bg-[#245C46] items-center justify-center text-white font-bold text-sm tracking-tight mb-1 shadow-xs">
            PF
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[#202522]">
            ProcureFlow
          </h1>
          <p className="text-xs text-[#727873]">
            Regional MSME B2B Procurement Operations
          </p>
        </div>

        {/* Demo Credentials Reference Strip (Pre-fills inputs, does not auto-login) */}
        <div className="rounded-[4px] border border-[#E5E7E4] bg-white p-3 space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[#727873]">
              <KeyRound className="h-3 w-3 text-[#245C46]" />
              <span>Demo Account Credentials</span>
            </div>
            <span className="text-[10px] text-[#8E948F]">Click to fill form</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectDemoAccount('buyer@abc.com')}
              className={`p-1.5 rounded-[4px] border text-left transition-colors ${
                email === 'buyer@abc.com' && !isRegister
                  ? 'border-[#245C46] bg-[#EDF4EF]'
                  : 'border-[#E5E7E4] hover:border-[#245C46] hover:bg-[#FAFAF9]'
              }`}
            >
              <div className="font-semibold text-[#202522] text-[11px] truncate">Buyer</div>
              <div className="text-[10px] text-[#727873] truncate">Ramesh (Chennai)</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('vendor1@tamilbearings.com')}
              className={`p-1.5 rounded-[4px] border text-left transition-colors ${
                email === 'vendor1@tamilbearings.com' && !isRegister
                  ? 'border-[#245C46] bg-[#EDF4EF]'
                  : 'border-[#E5E7E4] hover:border-[#245C46] hover:bg-[#FAFAF9]'
              }`}
            >
              <div className="font-semibold text-[#202522] text-[11px] truncate">Vendor 1</div>
              <div className="text-[10px] text-[#727873] truncate">Tamil Bearings</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('vendor2@southernsteels.com')}
              className={`p-1.5 rounded-[4px] border text-left transition-colors ${
                email === 'vendor2@southernsteels.com' && !isRegister
                  ? 'border-[#245C46] bg-[#EDF4EF]'
                  : 'border-[#E5E7E4] hover:border-[#245C46] hover:bg-[#FAFAF9]'
              }`}
            >
              <div className="font-semibold text-[#202522] text-[11px] truncate">Vendor 2</div>
              <div className="text-[10px] text-[#727873] truncate">Southern Steels</div>
            </button>
          </div>
        </div>

        {/* Main Auth Form Box */}
        <div className="rounded-[6px] border border-[#E5E7E4] bg-white p-5 shadow-xs space-y-4">
          {/* Tab Selector */}
          <div className="flex border-b border-[#E5E7E4] text-xs font-medium pb-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 pb-1 text-center transition-colors ${
                !isRegister
                  ? 'border-b-2 border-[#245C46] text-[#245C46] font-semibold'
                  : 'text-[#727873] hover:text-[#202522]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 pb-1 text-center transition-colors ${
                isRegister
                  ? 'border-b-2 border-[#245C46] text-[#245C46] font-semibold'
                  : 'text-[#727873] hover:text-[#202522]'
              }`}
            >
              Register Company
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-[4px] bg-[#FDF3F3] border border-[#F1BABA] text-xs text-[#B84040] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block font-medium text-[#202522] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full h-8 px-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[#202522] mb-1">Company / Entity</label>
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Apex Engineering"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#202522] mb-1">Industrial Hub</label>
                    <input
                      type="text"
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full h-8 px-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#202522] mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full h-8 px-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                  >
                    <option value="BUYER">Buyer (MSME Purchaser)</option>
                    <option value="VENDOR">Vendor (Supplier / Fabricator)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block font-medium text-[#202522] mb-1">Business Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="purchasing@company.com"
                className="w-full h-8 px-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202522] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-8 pl-2.5 pr-8 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E948F] hover:text-[#202522]"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-8 px-3 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white font-medium transition-colors disabled:opacity-50 mt-1 cursor-pointer"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register Company' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-[#8E948F]">
          ProcureFlow Enterprise Procurement Engine • 2026
        </div>
      </div>
    </div>
  );
};
