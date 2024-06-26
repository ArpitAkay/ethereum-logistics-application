import { ContentWrapper } from "../../components/ContentWrapper";
import bannerLogo from "/assets/banner.png";

const Home = () => {
  return (
    <ContentWrapper className="flex flex-col md:flex-row md:justify-between">
      <div className="w-full md:w-1/2 mt-16 px-4 md:px-12">
        <h1 className="mb-4 text-4xl md:text-6xl font-semibold text-center md:text-left font-['PoetsenOne']">
          Pickup And Delivery Services
        </h1>
        <div className="font-['DarkerGrotesque-Medium'] text-xl md:mt-8 ">
          <p className="mt-8 text-center md:text-left">
            Welcome to Dunzo Pickup Pulse! 🚚 Need a hassle-free way to
            transport your goods? Look no further! Our pickup and delivery
            services are here to make your life easier. Whether you're sending a
            package across town or need regular deliveries for your business,
            we've got you covered.
          </p>
          <p className="mt-4 text-center md:text-left">
            Our open sourced platform is dedicated to providing reliable and
            efficient logistics solutions tailored to your needs. From doorstep
            pickup to prompt deliveries, our system ensures your items reach
            their destination safely and on time. Have questions or ready to
            schedule a pickup? Login & start creating service requests!
          </p>
          <p className="mt-4 text-center md:text-left">
            Let's simplify transportation together. Contact us now to experience
            seamless pickup and delivery services!
          </p>
        </div>
      </div>
      <div className="w-full md:w-1/2 mt-8 sm:mt-40 flex justify-center items-start">
        <img src={bannerLogo} className="w-3/4 object-contain" alt="" />
      </div>
    </ContentWrapper>
  );
};

export default Home;
