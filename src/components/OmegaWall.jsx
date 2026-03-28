import React from 'react';
import { Lock, Zap, ShieldCheck, ArrowRight, CreditCard, ExternalLink } from 'lucide-react';

const OmegaWall = ({ setView, email }) => {
  const { currentTheme } = useNeuralTheme();
  const [userData, setUserData] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    const fetchInviteData = async () => {
      if (!email) return;
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('referral_count, v_token')
        .eq('email', email)
        .single();
      if (data) setUserData(data);
    };
    fetchInviteData();
  }, [email]);

  const referralLink = userData?.v_token 
    ? `${window.location.origin}/?ref=${userData.v_token}` 
    : 'Initializing node...';

  const handleCopy = () => {
    if (!userData?.v_token) return;
    navigator.clipboard.writeText(referralLink);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="feedback-container fade-in">
      <div className="feedback-card" style={{ maxWidth: '600px', margin: '40px auto', position: 'relative', overflow: 'hidden', borderTop: '4px solid #8b5cf6' }}>
        
        {/* Background "Omega" Ambient Glow */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '250px', height: '250px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>

        <div style={{ padding: '50px 30px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <Zap size={34} />
          </div>

          <p className="mono" style={{ color: '#8b5cf6', fontWeight: '800', fontSize: '0.7rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '15px' }}>
            // PROTOCOL_LOCKED :: UPGRADE_REQUIRED
          </p>
          
          <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: '800', marginBottom: '15px', letterSpacing: '-1.5px' }}>Unlock The Vault.</h1>
          
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '30px', lineHeight: '1.6' }}>
            This signal is currently encrypted. To gain immediate access to the full historical intelligence database, you must expand the neural network.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Milestone Progress</span>
                <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: '800' }}>{userData?.referral_count || 0} / 3 VERIFIED</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(((userData?.referral_count || 0) / 3) * 100, 100)}%`, height: '100%', background: '#8b5cf6', boxShadow: '0 0 10px #8b5cf6' }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px', lineHeight: '1.4' }}>
                <ShieldCheck size={12} style={{ marginRight: '6px', display: 'inline' }} /> 
                Reach 3 referrals to bypass all time-locks instantly.
            </p>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '8px', paddingLeft: '4px' }}>Your Referral Uplink</label>
            <div className="referral-link-container" style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <code style={{ flex: 1, fontSize: '0.8rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{referralLink}</code>
                <button onClick={handleCopy} style={{ background: '#8b5cf6', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer', flexShrink: 0 }}>
                    {copyStatus ? 'COPIED' : 'COPY'}
                </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => setView('archive')} 
              className="secondary-btn"
              style={{ padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', width: '100%', cursor: 'pointer' }}
            >
              Return to Archives
            </button>
            <p style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                Or wait for the weekly loyalty drip to unlock issues one by one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OmegaWall;
