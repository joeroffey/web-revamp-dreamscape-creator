import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-12 tracking-tight text-center">
                Cookie Policy
              </h1>
              
              <div className="text-muted-foreground space-y-8 leading-relaxed">
                <p>
                  This Cookie Policy explains how Revitalise Hub ("we", "us", or "our") uses cookies and similar technologies when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                </p>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">What are cookies?</h2>
                  
                  <p>
                    Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Why do we use cookies?</h2>
                  
                  <p>
                    We use cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our website.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">What types of cookies do we use?</h2>
                  
                  <ul className="space-y-3 list-disc ml-6">
                    <li><strong>Essential cookies:</strong> These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website or use a shopping cart.</li>
                    <li><strong>Analytical cookies:</strong> These allow us to recognise and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works.</li>
                    <li><strong>Functionality cookies:</strong> These are used to recognise you when you return to our website. This enables us to personalise our content for you and remember your preferences.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">How can you control cookies?</h2>
                  
                  <p>
                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject.
                  </p>
                  
                  <p>
                    You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Third-party cookies</h2>
                  
                  <p>
                    In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on. These cookies are served by third parties and we have no control over these cookies.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Updates to this Cookie Policy</h2>
                  
                  <p>
                    We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">Contact us</h2>
                  
                  <p>
                    If you have any questions about our use of cookies or other technologies, please email us at{" "}
                    <a href="mailto:info@revitalisehub.co.uk" className="text-primary hover:underline">
                      info@revitalisehub.co.uk
                    </a>
                    {" "}or contact us by post at:
                  </p>
                  
                  <div className="bg-muted/30 p-6 rounded-lg mt-4">
                    <p className="font-medium">Revitalise Hub</p>
                    <p>Unit 7, Ensign yard</p>
                    <p>670 Ampress Ln</p>
                    <p>Lymington SO41 8QY</p>
                    <p>United Kingdom</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;