import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="overflow-x-hidden bg-gray-50 text-dark-secondary">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-primary font-bold text-2xl">ecom.ai</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#features" className="border-transparent text-gray-600 hover:text-gray-900 hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Features</a>
                <a href="#pricing" className="border-transparent text-gray-600 hover:text-gray-900 hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Pricing</a>
                <a href="#testimonials" className="border-transparent text-gray-600 hover:text-gray-900 hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Testimonials</a>
                <a href="#faq" className="border-transparent text-gray-600 hover:text-gray-900 hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">FAQ</a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Log in</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-primary text-white hover:bg-primary/90">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button 
                type="button" 
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => {
                  const mobileMenu = document.getElementById('mobile-menu');
                  if (mobileMenu) {
                    mobileMenu.classList.toggle('hidden');
                  }
                }}
              >
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div id="mobile-menu" className="sm:hidden hidden">
          <div className="pt-2 pb-3 space-y-1">
            <a href="#features" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium">Features</a>
            <a href="#pricing" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium">Pricing</a>
            <a href="#testimonials" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium">Testimonials</a>
            <a href="#faq" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium">FAQ</a>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="space-y-1">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <div className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium">Dashboard</div>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <div className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium">Log in</div>
                  </Link>
                  <Link href="/signup">
                    <div className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium">Sign up</div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 bg-white pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Optimize for</span>
                  <span className="block text-primary">AI Search</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Add an AI chatbot to your website and automatically optimize your content for Answer Engine Optimization (AEO) to rank higher in AI search results.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="/signup">
                      <Button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 md:py-4 md:text-lg md:px-10">
                        Get started
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a href="#features">
                      <Button variant="outline" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-gray-100 hover:bg-gray-200 md:py-4 md:text-lg md:px-10">
                        See demo
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1400&h=900" alt="Marketing dashboard interface" />
        </div>
      </div>

      {/* Features */}
      <div id="features" className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Our platform provides all the tools necessary to create, manage, and optimize your marketing campaigns.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                  <i className="fas fa-robot text-2xl"></i>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">AI Chatbot Integration</h3>
                <p className="mt-2 text-gray-500">
                  Add a smart AI chatbot to your website to answer customer questions instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                  <i className="fas fa-search text-2xl"></i>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Answer Engine Optimization</h3>
                <p className="mt-2 text-gray-500">
                  Turn chatbot questions into SEO-optimized content that ranks in AI search results.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                  <i className="fas fa-code text-2xl"></i>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Easy Integration</h3>
                <p className="mt-2 text-gray-500">
                  Integrate with your website in minutes using our simple JavaScript snippet.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                  <i className="fas fa-chart-line text-2xl"></i>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Performance Analytics</h3>
                <p className="mt-2 text-gray-500">
                  Track chatbot usage, popular questions, and AEO content performance.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                  <i className="fas fa-shield-alt text-2xl"></i>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Content Approval Flow</h3>
                <p className="mt-2 text-gray-500">
                  Review and approve all content before it's published to your website.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                  <i className="fas fa-cogs text-2xl"></i>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Customizable Experience</h3>
                <p className="mt-2 text-gray-500">
                  Personalize your chatbot's appearance and behavior to match your brand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary tracking-wide uppercase">How it works</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Simple setup, powerful results</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Get up and running in minutes with our intuitive onboarding process.
            </p>
          </div>

          <div className="mt-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-gray-50 text-lg font-medium text-gray-900">
                  Three simple steps
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Create an account</h3>
                <p className="mt-2 text-center text-gray-500">
                  Sign up using email or OAuth with Google or GitHub. Two-factor authentication available for extra security.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Connect your website</h3>
                <p className="mt-2 text-center text-gray-500">
                  Install our JavaScript snippet on your website to enable the AI chatbot and prepare for AEO content.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Start optimizing</h3>
                <p className="mt-2 text-center text-gray-500">
                  Review and approve AEO content generated from real user questions to your chatbot.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Dashboard</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Powerful insights at a glance</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Our intuitive dashboard gives you all the data you need to make informed decisions.
            </p>
          </div>

          <div className="mt-12 relative">
            <div className="rounded-xl overflow-hidden shadow-xl">
              <img className="w-full" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080" alt="Marketing dashboard interface" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Pricing</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Simple, transparent pricing</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Choose the plan that fits your needs. All plans include core features.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Starter Plan */}
            <div className="border border-gray-200 bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Starter</h3>
                <p className="mt-4 text-sm text-gray-500">Perfect for small businesses just getting started.</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$29</span>
                  <span className="text-base font-medium text-gray-500">/mo</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Up to 5,000 contacts</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Basic email campaigns</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Standard analytics</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Email support</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link href="/signup">
                    <Button className="w-full">Get started</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="border border-primary bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Professional</h3>
                <p className="mt-4 text-sm text-gray-500">For growing businesses with more advanced needs.</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$79</span>
                  <span className="text-base font-medium text-gray-500">/mo</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Up to 25,000 contacts</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Advanced email campaigns</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Detailed analytics</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">AI recommendations</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Priority support</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link href="/signup">
                    <Button className="w-full">Get started</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-gray-200 bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Enterprise</h3>
                <p className="mt-4 text-sm text-gray-500">For large organizations with complex requirements.</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">$249</span>
                  <span className="text-base font-medium text-gray-500">/mo</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Unlimited contacts</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Premium email campaigns</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Enterprise analytics</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Advanced AI tools</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Dedicated account manager</span>
                  </li>
                  <li className="flex">
                    <i className="fas fa-check text-success flex-shrink-0 mt-1"></i>
                    <span className="ml-3 text-sm text-gray-500">Custom integrations</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link href="/signup">
                    <Button className="w-full">Contact sales</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">What our customers say</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="text-primary">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
              <p className="text-gray-600 italic">"ecom.ai has transformed our marketing strategy. The analytics provide insights we never had before, and our engagement rates have increased by 40%."</p>
              <div className="mt-4 flex items-center">
                <div className="ml-4">
                  <h4 className="text-sm font-bold text-gray-900">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500">Marketing Director, TechCorp</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="text-primary">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
              <p className="text-gray-600 italic">"The ease of integration was what sold us, but the results keep us coming back. Our email open rates have doubled since implementing ecom.ai."</p>
              <div className="mt-4 flex items-center">
                <div className="ml-4">
                  <h4 className="text-sm font-bold text-gray-900">Mike Peters</h4>
                  <p className="text-sm text-gray-500">CEO, GrowthLabs</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="text-primary">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
              </div>
              <p className="text-gray-600 italic">"As a small business owner, I needed something easy to use that wouldn't break the bank. MarkSync delivers on both fronts and has helped us grow significantly."</p>
              <div className="mt-4 flex items-center">
                <div className="ml-4">
                  <h4 className="text-sm font-bold text-gray-900">Lisa Wong</h4>
                  <p className="text-sm text-gray-500">Owner, Artisan Crafts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-primary tracking-wide uppercase">FAQ</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Frequently asked questions</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Find answers to common questions about our platform.
            </p>
          </div>

          <div className="mt-12 max-w-3xl mx-auto divide-y divide-gray-200">
            {/* FAQ Item 1 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">How does the website integration work?</h3>
              <div className="mt-2 text-gray-600">
                <p>We provide a simple JavaScript snippet that you can add to your website's header. Alternatively, if you use WordPress, Shopify, or other popular CMS platforms, you can install our plugin for seamless integration.</p>
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">Can I migrate from another platform?</h3>
              <div className="mt-2 text-gray-600">
                <p>Absolutely! We offer migration tools to help you move your data from other platforms. Our team can also provide assistance to ensure a smooth transition.</p>
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">What kind of support do you offer?</h3>
              <div className="mt-2 text-gray-600">
                <p>We provide email support for all plans, with priority support for Professional plans and dedicated account managers for Enterprise customers. We also have an extensive knowledge base and regular webinars.</p>
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">Is there a free trial available?</h3>
              <div className="mt-2 text-gray-600">
                <p>Yes, we offer a 14-day free trial for all plans. No credit card required. You'll have full access to all features during the trial period.</p>
              </div>
            </div>

            {/* FAQ Item 5 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">How secure is my data?</h3>
              <div className="mt-2 text-gray-600">
                <p>Security is our top priority. We use industry-standard encryption, regular security audits, and comply with GDPR, CCPA, and other privacy regulations. Your data is stored in secure, redundant data centers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            <span className="block">Ready to boost your marketing?</span>
            <span className="block text-secondary">Start your free trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/signup">
                <Button variant="secondary" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50">
                  Get started
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a href="#contact">
                <Button className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-secondary/90">
                  Contact sales
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Product
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#features" className="text-base text-gray-400 hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-base text-gray-400 hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Resources
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Webinars
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Partners
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-400 hover:text-white">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} MarkSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
