import { useEffect } from 'react'
import { About, SpaceGallery, Testimonials } from '../components/SpaceAbout'
import { BookingV2 } from '../components/BookingV2'
import { Footer, MobileTabBar } from '../components/FooterMobile'
import { Header } from '../components/Header'
import { Hero, Philosophy } from '../components/HeroPhilosophy'
import { Ritual, Services } from '../components/ServicesRitual'
import { useSiteStore } from '../store/useSiteStore'

export default function Home() {
  const setActiveSection = useSiteStore((state) => state.setActiveSection)

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.observe-reveal').forEach((element) => revealObserver.observe(element))

    const sections = ['home', 'services', 'space', 'booking']
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActiveSection(visible.target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.35] },
    )
    sections.forEach((id) => {
      const section = document.getElementById(id)
      if (section) sectionObserver.observe(section)
    })

    return () => {
      revealObserver.disconnect()
      sectionObserver.disconnect()
    }
  }, [setActiveSection])

  useEffect(() => {
    const sectionId = window.location.hash.slice(1)
    const validSections = new Set([
      'home',
      'philosophy',
      'services',
      'space',
      'about',
      'booking',
    ])
    if (!validSections.has(sectionId)) return

    const scrollToSection = () => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      })
    }

    scrollToSection()
    const frame = window.requestAnimationFrame(scrollToSection)
    const timer = window.setTimeout(scrollToSection, 150)
    window.addEventListener('load', scrollToSection, { once: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.removeEventListener('load', scrollToSection)
    }
  }, [])

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Philosophy />
        <Services />
        <Ritual />
        <SpaceGallery />
        <About />
        <Testimonials />
        <BookingV2 />
      </main>
      <Footer />
      <MobileTabBar />
    </>
  )
}
