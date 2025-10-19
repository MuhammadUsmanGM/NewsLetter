import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Welcome from './components/Welcome'
import './App.css'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    timezone: ''
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successTransition, setSuccessTransition] = useState(false);

  useEffect(() => {
    // Get user timezone and update form data
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setFormData(prevFormData => ({
      ...prevFormData,
      timezone: userTimezone
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (errors[name] || apiError) {
      setErrors({
        ...errors,
        [name]: ''
      });
      setApiError('');
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setApiError(''); // Clear any previous API errors
      
      try {
        // Insert data into Supabase table
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .insert([
            { name: formData.name, email: formData.email, timezone: formData.timezone }
          ]);
        
        if (error) {
          throw error;
        }
        
        console.log('User subscribed:', data);
        setSubmitted(true);
        setSuccessTransition(false); // Reset the transition state
        
        // Reset form after success with a smooth transition
        setTimeout(() => {
          setSuccessTransition(true); // Trigger the fade-out transition
          
          // Reset form after animation completes
          setTimeout(() => {
            setSubmitted(false);
            setSuccessTransition(false); // Reset for next time
            // Get user timezone and reset form with new timezone
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setFormData({ name: '', email: '', timezone: userTimezone });
            setIsLoading(false);
          }, 500);
        }, 3000);
      } catch (error) {
        console.error('Error subscribing:', error.message);
        setIsLoading(false);
        
        // Provide more specific error messages
        let errorMessage = 'An error occurred while subscribing. Please try again.';
        
        if (error.code === '23505') { // Unique violation error code in PostgreSQL
          errorMessage = 'This email is already subscribed to our newsletter.';
        } else if (error.message.includes('newsletter_subscribers_email_key')) {
          errorMessage = 'This email is already subscribed to our newsletter.';
        } else if (error.message.toLowerCase().includes('duplicate')) {
          errorMessage = 'This email is already subscribed to our newsletter.';
        } else if (error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('policy')) {
          errorMessage = 'Access denied. Please try again later.';
        } else if (error.message.toLowerCase().includes('network') || error.status === 0) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        setApiError(errorMessage);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  if (showWelcome) {
    return <Welcome onWelcomeComplete={handleWelcomeComplete} />;
  }

  return (
    <div className="newsletter-container">
      <div className="newsletter-card">
        <div className="logo-section">
          <h1>AI Updates Newsletter</h1>
          <p>This newsletter is about AI updates, insights, and exclusive content delivered to your inbox.</p>
        </div>
        
        {submitted ? (
          <div className={`success-message ${successTransition ? 'fade-out' : ''}`}>
            <h2>Subscribed Successfully!</h2>
            <p>Thank you for joining our newsletter. You'll receive AI updates soon!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-form">
            {apiError && (
              <div className="api-error-message fade-in">
                {apiError}
              </div>
            )}
            <div className="input-group">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                className={`stunning-input ${errors.name ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.name && <span className="error-message fade-in">{errors.name}</span>}
            </div>
            
            <div className="input-group">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email Address"
                className={`stunning-input ${errors.email ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.email && <span className="error-message fade-in">{errors.email}</span>}
            </div>
            
            <input
              type="hidden"
              name="timezone"
              value={formData.timezone}
            />
            
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
        <div className="github-link">
          <a href="https://github.com/MuhammadUsmanGM" target="_blank" rel="noopener noreferrer">
            <svg className="github-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
            </svg>
            <span>Follow me on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
