
import Faq from "./faq/Faq";
import FeaturesPage from "./features/FeaturesPage";
import Footer from "./footer/Footer";
import HeroPage from "./hero/HeroPage";
import LandingNavbar from "./navbar/LandingNavbar";

const Landing = () => {
  return (
    <div className="p-0 m-0">
        <LandingNavbar/>
      <main className="p-0 m-0">
        <HeroPage  />
        <FeaturesPage/>
        <Faq/>
        <Footer/>
      </main>
    </div>
  );
};

export default Landing;
