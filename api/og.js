
import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#020617',
              color: '#ffffff',
              padding: '40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '60px', fontWeight: '800', letterSpacing: '-2px' }}>
                THE <span style={{ color: '#10b981' }}>SIGNAL.</span>
              </h1>
            </div>
            <p style={{ fontSize: '24px', color: '#94a3b8' }}>Weekly AI Intelligence Protocol</p>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const { data: issue, error } = await supabase
      .from('newsletter_archive')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !issue) {
       return new Response("Issue not found", { status: 404 });
    }

    // Extract headlines (h2 tags) from content_html
    const headlineMatches = issue.content_html.match(/<h2[^>]*>(.*?)<\/h2>/g) || [];
    const headlines = headlineMatches.map(h => h.replace(/<[^>]*>/g, '').trim()).slice(0, 3);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#020617',
            color: '#ffffff',
            padding: '60px',
            position: 'relative',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Background Pattern */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 100% 100%, #064e3b 0%, transparent 40%), radial-gradient(circle at 0% 0%, #064e3b 0%, transparent 40%)',
              opacity: 0.3,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                display: 'flex', 
                padding: '6px 16px', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                borderRadius: '20px', 
                color: '#10b981', 
                fontSize: '14px', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '2px',
                marginBottom: '20px',
                width: 'fit-content'
              }}>
                Protocol Record #{id}
              </div>
              <h1 style={{ fontSize: '72px', fontWeight: '800', margin: 0, letterSpacing: '-3px' }}>
                THE <span style={{ color: '#10b981' }}>SIGNAL.</span>
              </h1>
              <p style={{ fontSize: '24px', color: '#94a3b8', margin: '10px 0 0 0' }}>{issue.week_date}</p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            marginTop: 'auto', 
            gap: '20px',
            zIndex: 10 
          }}>
            <div style={{ fontSize: '18px', color: '#10b981', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Intelligence Briefing:
            </div>
            {headlines.map((headline, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>0{i+1}</div>
                <div style={{ fontSize: '32px', fontWeight: '700', lineHeight: '1.2', color: '#f8fafc' }}>
                  {headline}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Decoration */}
          <div style={{ 
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '14px',
            color: '#475569',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Extracted for technical elite
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
