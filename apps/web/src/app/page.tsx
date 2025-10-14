import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react'

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

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                Interactive charts powered by TradingView technology for professional analysis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-strong rounded-2xl p-8 space-y-4 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                Your API keys are encrypted with AES-256. We never see your private data.
              </p>
            </div>
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
