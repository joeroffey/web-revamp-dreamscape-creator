import { Navigation } from "@/components/Navigation";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-12 tracking-tight text-center">
                Privacy Policy
              </h1>
              
              <div className="text-muted-foreground space-y-8 leading-relaxed">
                <p>
                  At Revitalise Hub, we are committed to protecting the privacy and security of our clients' personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our services or interact with our website.
                </p>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect:</h2>
                  
                  <p className="mb-4">
                    <strong>Personal Information:</strong> When you use our services or visit our website, we may collect personal information such as your name, email address, phone number, and billing information.
                  </p>
                  
                  <p className="mb-4">
                    <strong>Usage Information:</strong> We may collect information about how you interact with our services, including your usage patterns, preferences, and browsing history.
                  </p>
                  
                  <p>
                    <strong>Device Information:</strong> We may collect information about the device you use to access our services, including your IP address, browser type, and operating system.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information:</h2>
                  
                  <p className="mb-4">
                    <strong>Providing Services:</strong> We use your personal information to provide and maintain our services, including scheduling appointments, processing payments, and communicating with you about your bookings.
                  </p>
                  
                  <p className="mb-4">
                    <strong>Improving Services:</strong> We may use your information to analyze trends, track user activity, and improve the quality of our services and user experience.
                  </p>
                  
                  <p>
                    <strong>Marketing and Communications:</strong> With your consent, we may use your contact information to send you promotional materials, updates, and newsletters about our services.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Information Sharing and Disclosure:</h2>
                  
                  <p className="mb-4">
                    <strong>Third-Party Service Providers:</strong> We may share your information with third-party service providers who assist us in operating our business, such as payment processors, email service providers, and analytics platforms.
                  </p>
                  
                  <p>
                    <strong>Legal Compliance:</strong> We may disclose your information if required by law or to protect our rights, property, or safety, or the rights, property, or safety of others.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security:</h2>
                  
                  <p>
                    We implement appropriate security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Your Choices and Rights:</h2>
                  
                  <p className="mb-4">
                    <strong>Access and Correction:</strong> You have the right to access and correct your personal information. You may update your account information or contact us to request access to or correction of your information.
                  </p>
                  
                  <p>
                    <strong>Opt-Out:</strong> You may opt out of receiving promotional communications from us by following the unsubscribe instructions included in our emails or by contacting us directly.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Privacy Policy:</h2>
                  
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us:</h2>
                  
                  <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at{" "}
                    <a href="mailto:info@revitalisehub.co.uk" className="text-primary hover:underline">
                      info@revitalisehub.co.uk
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;