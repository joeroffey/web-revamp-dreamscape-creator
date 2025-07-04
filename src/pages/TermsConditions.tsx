import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const TermsConditions = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-12 tracking-tight text-center">
                Terms & Conditions for Sessions at Revitalise Hub
              </h1>
              
              <div className="text-muted-foreground space-y-8 leading-relaxed">
                <p>
                  These terms and conditions (the "Agreement") govern your use of the drop-in services provided by Revitalise Hub (the "Services"). By using the Services, you agree to be bound by this Agreement. If you do not agree to these terms, you should not use the Services.
                </p>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">1. Eligibility</h2>
                  <p>
                    You must be at least 18 years old to use the Services. If you are under the age of 18, you must have the permission of a parent or legal guardian to use the Services.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">2. Use of Services</h2>
                  <p>
                    You may use the Services only for the duration of the drop-in session, which is typically one hour. You will be required to sign a waiver before using the Services.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">3. Fees</h2>
                  <p>
                    A fee is required for each drop-in session, which may vary depending on the type of Service. Payment must be made in full prior to using the Services.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">4. Cancellation Policy</h2>
                  <p>
                    If you need to cancel your drop-in session, you must do so at least 1 hour in advance. Failure to cancel within this timeframe will result in no refund being issued.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">5. Code of Conduct</h2>
                  <p>
                    You are expected to conduct yourself in a respectful manner while using the Services. Any inappropriate or disruptive behavior may result in immediate termination of your use of the Services.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
                  <p>
                    To the fullest extent permitted by law, Revitalise Hub (including its officers, employees, agents, and subcontractors) shall not be liable for any injury, loss, or damage (including indirect or consequential losses) suffered by you or any third party in connection with your use of Revitalise Hub's facilities, services, or equipment.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">7. Termination</h2>
                  <p>
                    Revitalise Hub reserves the right to terminate your use of the Services at any time, with or without cause. If your use of the Services is terminated, you will not be entitled to a refund.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">8. Governing Law</h2>
                  <p>
                    These Terms and Conditions shall be governed by and construed in accordance with the laws of England and Wales. Any disputes or claims arising out of or in connection with these Terms and Conditions shall be subject to the exclusive jurisdiction of the English courts.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">9. Entire Agreement</h2>
                  <p>
                    This Agreement constitutes the entire agreement between you and Revitalise Hub regarding the Services and supersedes all prior or contemporaneous communications and proposals, whether oral or written.
                  </p>
                </div>

                <div className="bg-muted/30 p-6 rounded-lg">
                  <p className="font-medium text-foreground">
                    By signing up for and using the drop-in services provided by Revitalise Hub, you acknowledge that you have read and agree to be bound by this Agreement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsConditions;