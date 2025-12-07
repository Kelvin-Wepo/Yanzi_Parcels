import { Link, useNavigate } from 'react-router-dom'
import { 
  Package, 
  Truck, 
  Shield, 
  Clock, 
  MapPin, 
  ArrowRight,
  CheckCircle,
  Phone,
  Banknote,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useEffect, useState } from 'react'
import { CustomerSendingAnimation, CourierDeliveringAnimation } from '../components/animations'

const features = [
  {
    icon: Clock,
    title: 'Same-Day Delivery',
    description: 'Get your parcels delivered within Nairobi and major towns the same day.',
  },
  {
    icon: Shield,
    title: 'Secure & Insured',
    description: 'All packages are insured. Your items are protected throughout transit.',
  },
  {
    icon: MapPin,
    title: 'Live Tracking',
    description: 'Track your parcel in real-time. Know exactly where your delivery is.',
  },
  {
    icon: Banknote,
    title: 'Fair Pricing',
    description: 'Transparent KES pricing. No hidden charges or surprise fees.',
  }
]

const steps = [
  { number: '1', title: 'Request Delivery', description: 'Enter pickup & delivery locations' },
  { number: '2', title: 'Get Matched', description: 'A verified courier accepts your job' },
  { number: '3', title: 'Track Progress', description: 'Monitor delivery in real-time' },
  { number: '4', title: 'Receive Package', description: 'Get photo confirmation on delivery' },
]

// Hero carousel images - African people sending/receiving parcels (75% smaller)
const heroImages = [
  {
    url: 'https://images.pexels.com/photos/6169668/pexels-photo-6169668.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&dpr=1',
    alt: 'African woman receiving delivery package',
    title: 'Fast Delivery Across Kenya'
  },
  {
    url: 'https://images.pexels.com/photos/6169659/pexels-photo-6169659.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&dpr=1',
    alt: 'African delivery man with parcels',
    title: 'Trusted by Thousands'
  },
  {
    url: 'https://images.pexels.com/photos/6169656/pexels-photo-6169656.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&dpr=1',
    alt: 'African customer happy with package delivery',
    title: 'Same-Day Delivery'
  },
  {
    url: 'https://images.pexels.com/photos/7709219/pexels-photo-7709219.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&dpr=1',
    alt: 'African business owner packing parcels',
    title: 'Safe & Secure Parcels'
  }
]

export default function Home() {
  const { isAuthenticated, userType } = useAuthStore()
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(userType === 'customer' ? '/customer' : '/courier')
    }
  }, [isAuthenticated, userType, navigate])

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Yanzi</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Carousel Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
            </div>
          ))}
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Trusted by 15,000+ Kenyans
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Fast & Reliable Parcel Delivery Across <span className="text-green-400">Kenya</span>
              </h1>
              <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-xl">
                Send packages anywhere in Kenya. Connect with verified couriers, 
                track deliveries in real-time, and pay securely via M-Pesa.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                <Link to="/register" className="btn bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 font-semibold transition-all transform hover:scale-105">
                  Send a Package
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/register?type=courier" className="btn bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-lg inline-flex items-center gap-2 font-semibold backdrop-blur-sm transition-all">
                  <Truck className="w-5 h-5" />
                  Become a Courier
                </Link>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>M-Pesa Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Live GPS Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Insured Delivery</span>
                </div>
              </div>
            </div>
            
            {/* Tracking Card Preview */}
            <div className="hidden lg:block">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Tracking</p>
                    <p className="font-semibold text-gray-900">#YNZ-2024-78543</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">In Transit</span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full mt-1"></div>
                    <div>
                      <p className="text-xs text-gray-500">Picked up</p>
                      <p className="text-sm font-medium text-gray-900">Westlands, Nairobi</p>
                    </div>
                  </div>
                  <div className="ml-1.5 w-px h-6 bg-green-200"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1 animate-pulse"></div>
                    <div>
                      <p className="text-xs text-gray-500">Current Location</p>
                      <p className="text-sm font-medium text-gray-900">Thika Road, Near Garden City</p>
                    </div>
                  </div>
                  <div className="ml-1.5 w-px h-6 bg-gray-200"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mt-1"></div>
                    <div>
                      <p className="text-xs text-gray-500">Delivery</p>
                      <p className="text-sm font-medium text-gray-900">Ruiru, Kiambu</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-700">JK</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">John Kamau</p>
                      <p className="text-xs text-gray-500">Courier</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ETA</p>
                    <p className="text-sm font-semibold text-green-600">25 mins</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why Choose Yanzi?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Built for Kenya. We understand local logistics challenges and provide solutions that work.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              How It Works
            </h2>
            <p className="text-gray-400">
              Get your package delivered in 4 simple steps
            </p>
          </div>
          
          {/* Animations */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gray-800 rounded-xl p-8 text-center hover:bg-gray-750 transition-colors">
              <CustomerSendingAnimation className="w-full h-48 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Send a Package</h3>
              <p className="text-gray-400">Request delivery from your location to anywhere in Kenya</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-8 text-center hover:bg-gray-750 transition-colors">
              <CourierDeliveringAnimation className="w-full h-48 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Fast Delivery</h3>
              <p className="text-gray-400">Our verified couriers deliver your package safely</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/30">
                  <span className="text-xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600">
              Pay only for what you ship. No subscription required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200 hover:border-green-300 transition-colors hover:shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Within CBD</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">KES 150</p>
              <p className="text-sm text-gray-500">Starting price</p>
            </div>
            <div className="bg-white p-8 rounded-xl text-center border-2 border-green-500 shadow-lg relative">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Popular</span>
              <h3 className="font-semibold text-gray-900 mb-2">Within Nairobi</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">KES 250</p>
              <p className="text-sm text-gray-500">Starting price</p>
            </div>
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200 hover:border-green-300 transition-colors hover:shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Intercounty</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">KES 500</p>
              <p className="text-sm text-gray-500">Starting price</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-green-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Shipping?
          </h2>
          <p className="text-green-100 mb-8 max-w-lg mx-auto text-lg">
            Join thousands of Kenyan businesses and individuals who trust Yanzi for their deliveries.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn bg-white text-green-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105">
              Create Free Account
            </Link>
            <a href="tel:+254700000000" className="btn bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-lg inline-flex items-center justify-center gap-2 font-semibold transition-all">
              <Phone className="w-5 h-5" />
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">Yanzi</span>
              </div>
              <p className="text-sm text-gray-400">
                Kenya's trusted parcel delivery platform. Fast, secure, and affordable.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Yanzi Parcels. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Made with ❤️ in Kenya
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
