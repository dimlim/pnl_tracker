import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowRight, TrendingUp, Shield, Zap, BarChart3, 
  FileText, Download, Sparkles, Check, Star,
  Target, Calendar, DollarSign, Lock
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent" />
        
        <div className="container relative z-10 px-4 py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-muted-foreground">Professional Portfolio Tracking</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Track Your Crypto
              <br />
              <span className="text-gradient">Like a Pro</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced PnL calculations, real-time tracking, and beautiful analytics for your cryptocurrency portfolio.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-base">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="glass" className="text-base">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gradient">FIFO</div>
                <div className="text-sm text-muted-foreground">LIFO & AVG</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gradient">Real-time</div>
                <div className="text-sm text-muted-foreground">Price Updates</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gradient">Secure</div>
                <div className="text-sm text-muted-foreground">Encrypted Keys</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-muted-foreground/30 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to track your crypto portfolio</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="glass-strong rounded-2xl p-8 space-y-4 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold">Advanced PnL</h3>
              <p className="text-muted-foreground">
                FIFO, LIFO, and Average Cost methods with fee calculations for accurate profit tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-strong rounded-2xl p-8 space-y-4 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold">Beautiful Charts</h3>
              <p className="text-muted-foreground">
                Interactive charts and sparklines for professional portfolio analysis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-strong rounded-2xl p-8 space-y-4 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                Your data is encrypted with AES-256. We never see your private information.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-strong rounded-2xl p-8 space-y-4 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold">Tax Reports</h3>
              <p className="text-muted-foreground">
                Automatic capital gains calculations and export for tax filing.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-strong rounded-2xl p-8 space-y-4 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold">Quick Insights</h3>
              <p className="text-muted-foreground">
                Smart insights about your best performers and portfolio health.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-strong rounded-2xl p-8 space-y-4 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                <Download className="w-6 h-6 text-fuchsia-400" />
              </div>
              <h3 className="text-xl font-semibold">Bulk Operations</h3>
              <p className="text-muted-foreground">
                Select, move, delete, or export multiple transactions at once.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="glass-strong border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-profit" />
                    <span>Unlimited portfolios</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-profit" />
                    <span>Real-time price tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-profit" />
                    <span>FIFO/LIFO/AVG methods</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-profit" />
                    <span>Beautiful charts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-profit" />
                    <span>Quick insights</span>
                  </li>
                </ul>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/signup">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="glass-strong border-violet-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white px-4 py-1 text-sm font-semibold">
                Popular
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Premium</CardTitle>
                <CardDescription>For serious traders</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-profit" />
                    <span className="font-semibold">Everything in Free, plus:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Tax reports export (PDF/CSV)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Advanced tax calculations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Early access to new features</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500">
                  <Link href="/signup">Upgrade to Premium</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Trusted by Crypto Traders</h2>
            <p className="text-xl text-muted-foreground">Join thousands tracking their portfolios</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="glass-strong border-white/10">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Best crypto portfolio tracker I've used. The tax reports alone are worth the premium subscription!"
                </p>
                <p className="font-semibold">Alex M.</p>
                <p className="text-sm text-muted-foreground">Day Trader</p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-white/10">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Finally, a tracker that handles FIFO/LIFO correctly. The insights feature is incredibly helpful."
                </p>
                <p className="font-semibold">Sarah K.</p>
                <p className="text-sm text-muted-foreground">Investor</p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-white/10">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Clean interface, powerful features. Exactly what I needed for managing multiple portfolios."
                </p>
                <p className="font-semibold">Mike R.</p>
                <p className="text-sm text-muted-foreground">Portfolio Manager</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto">
          <div className="glass-strong rounded-3xl p-12 md:p-16 text-center space-y-8 max-w-4xl mx-auto glow-border">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Take Control?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of traders tracking their portfolios with precision.
            </p>
            <Button asChild size="lg" className="text-base">
              <Link href="/signup">
                Start Tracking Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 Crypto PnL Tracker. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
