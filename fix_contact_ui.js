const fs = require('fs');

let content = fs.readFileSync('pages/contact.js', 'utf8');

// 1. Simplify Hero Section
const oldHero = `        <section
          style={{
            background: 'linear-gradient(135deg, rgba(240,148,51,0.07) 0%, rgba(225,48,108,0.07) 50%, rgba(188,24,136,0.07) 100%)',
            borderBottom: '1px solid var(--border)',
            padding: '64px 24px 56px',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s ease',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'var(--gradient)',
              marginBottom: 20,
              boxShadow: '0 8px 24px rgba(220, 39, 67, 0.25)',
            }}
          >
            <Mail size={28} color="white" strokeWidth={1.8} />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text)',
              marginBottom: 14,
              lineHeight: 1.15,
            }}
          >
            Contact Us
          </h1>
          <p
            style={{
              color: 'var(--text-dim)',
              fontSize: 'clamp(14px, 2vw, 16px)',
              maxWidth: 620,
              margin: '0 auto',
              lineHeight: 1.75,
            }}
          >
            We&apos;d love to hear from you. Whether you have feedback, found incorrect information,
            want to suggest a profile, report a technical issue, discuss a business opportunity,
            or have copyright concerns — we&apos;re here to help.
          </p>
        </section>`;

const newHero = `        <section
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '80px 24px 60px',
            animation: 'fadeInUp 0.5s ease',
          }}
        >
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              Contact Us
            </h1>
            <p
              style={{
                color: 'var(--text-dim)',
                fontSize: 'clamp(15px, 2vw, 17px)',
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              We&apos;d love to hear from you. Whether you have feedback, found incorrect information,
              want to suggest a profile, report a technical issue, discuss a business opportunity,
              or have copyright concerns — we&apos;re here to help.
            </p>
          </div>
        </section>`;

content = content.replace(oldHero, newHero);

// 2. Change borders and shadows on cards
// Left info card
content = content.replace(/borderRadius: 20/g, "borderRadius: 12");
content = content.replace(/boxShadow: '0 4px 20px rgba\\(0,0,0,0\\.05\\)'/g, "boxShadow: '0 2px 8px rgba(0,0,0,0.04)'");

// Email block in left card
const oldEmailBlock = `              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(240,148,51,0.06), rgba(188,24,136,0.06))',
                  border: '1px solid rgba(225, 48, 108, 0.15)',
                  borderRadius: 14,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(220,39,67,0.25)',
                  }}
                >
                  <Mail size={20} color="white" strokeWidth={1.8} />
                </div>`;

const newEmailBlock = `              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '20px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={18} color="var(--text-muted)" strokeWidth={1.8} />
                </div>`;

content = content.replace(oldEmailBlock, newEmailBlock);

// Remove bright gradient focus ring from inputs
const oldInputFocusStyle = `          .contact-input:focus {
            border-color: var(--accent) !important;
            box-shadow: 0 0 0 3px rgba(225, 48, 108, 0.1);
          }`;

const newInputFocusStyle = `          .contact-input:focus {
            border-color: var(--text) !important;
            box-shadow: 0 0 0 1px var(--text);
          }`;

content = content.replace(oldInputFocusStyle, newInputFocusStyle);

// Input styling inside render
const oldInputRenderStyle = `    background: 'var(--surface2)',
    border: \`1px solid \${hasError ? 'var(--red)' : 'var(--border)'}\`,
    borderRadius: 12,
    color: 'var(--text)',
    fontSize: 15,
    outline: 'none',
    transition: 'all 0.2s ease',`;

const newInputRenderStyle = `    background: 'var(--surface)',
    border: \`1px solid \${hasError ? 'var(--red)' : 'var(--border)'}\`,
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 15,
    outline: 'none',
    transition: 'all 0.2s ease',`;

content = content.replace(oldInputRenderStyle, newInputRenderStyle);

const oldSubmitBtnStyle = `borderRadius: 24`;
const newSubmitBtnStyle = `borderRadius: 8`;
// There are multiple instances of borderRadius maybe? Let's just do a string replace
content = content.replace(oldSubmitBtnStyle, newSubmitBtnStyle);

// Make the FAQ card look professional
const oldFaqCard = `                style={{
                  background: 'var(--surface2)',
                  borderRadius: 16,
                  padding: '28px 24px',
                  marginBottom: 32,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                }}`;
                
const newFaqCard = `                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '28px 24px',
                  marginBottom: 32,
                }}`;

content = content.replace(oldFaqCard, newFaqCard);

fs.writeFileSync('pages/contact.js', content);
console.log("Transform completed.");
