import { useEffect } from 'react';
import { useHomeData } from '../hooks/queries';
import { tokenManager } from '../services/tokenManager';
import { motion } from 'framer-motion';

import Navbar from '../components/home/Navbar';
import HeroCarousel from '../components/home/HeroCarousel';
import FeatureHighlight from '../components/home/FeatureHighlight';
import CategorySlider from '../components/home/CategorySlider';
import BookSection from '../components/home/BookSection';
import Footer from '../components/home/Footer';
import ToastNotification from '../components/home/ToastNotification';

const HomePage = () => {
  const { data: homeData, isLoading } = useHomeData();

  useEffect(() => {
    // Handle auto-login from email verification link
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Verify token is valid before setting it
      // Decode JWT to check expiration (without verification for speed)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp;

          // Check if token is expired
          if (exp && Date.now() >= exp * 1000) {
            // Remove token from URL and show error
            window.history.replaceState({}, document.title, "/");
            return;
          }

          // Token not expired, verify with backend
          tokenManager.updateAuth(token, { data: payload });
          window.history.replaceState({}, document.title, "/");
          window.location.reload();
        }
      } catch {
        window.history.replaceState({}, document.title, "/");
      }
    }
  }, []);

  // Process home data from React Query
  const carouselData = homeData ? (() => {
    const carouselBooks = (homeData.carousel?.books || []).map(b => ({...b, _type: 'book'}));
    const carouselEbooks = (homeData.carousel?.ebooks || []).map(b => ({...b, _type: 'ebook'}));
    const combinedCarousel = [...carouselBooks, ...carouselEbooks];
    combinedCarousel.sort((a, b) => (a.carousel_order || 999) - (b.carousel_order || 999));
    return combinedCarousel;
  })() : [];

  const categoriesData = homeData?.categories || [];
  
  const hotBooksData = homeData ? [
    ...(homeData.hot?.books || []).map(b => ({...b, _type: 'book'})), 
    ...(homeData.hot?.ebooks || []).map(b => ({...b, _type: 'ebook'}))
  ] : [];
  
  const featuredBooksData = homeData ? [
    ...(homeData.featured?.books || []).map(b => ({...b, _type: 'book'})), 
    ...(homeData.featured?.ebooks || []).map(b => ({...b, _type: 'ebook'}))
  ] : [];
  
  const freeEbooksData = homeData ? (homeData.free_ebooks || []).map(b => ({...b, _type: 'ebook'})) : [];



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <ToastNotification />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1"
      >
        <HeroCarousel slides={carouselData} isLoading={isLoading} />
        <FeatureHighlight />
        <CategorySlider categories={categoriesData} isLoading={isLoading} />

        <BookSection
          title="Sách Hot (Nhiều người quan tâm)"
          books={hotBooksData}
          isLoading={isLoading}
        />

        <BookSection
          title="Sách Nổi Bật"
          books={featuredBooksData}
          isLoading={isLoading}
          highlighted={true}
        />

        <BookSection
          title="E-Books Miễn phí"
          books={freeEbooksData}
          isLoading={isLoading}
        />
      </motion.main>

      <Footer />
    </div>
  );
};

export default HomePage;
