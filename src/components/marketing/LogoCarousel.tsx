import { useState } from "react";
import { Logo } from "@/data/logos";

interface LogoCarouselProps {
  logos: Logo[];
  heading?: string;
}

const LogoCarousel = ({ logos, heading }: LogoCarouselProps) => {
  const [isPaused, setIsPaused] = useState(false);

  const LogoItem = ({ logo }: { logo: Logo }) => {
    const content = (
      <img
        src={logo.src}
        alt={logo.alt}
        className="h-7 md:h-9 lg:h-11 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
      />
    );

    if (logo.url) {
      return (
        <a
          href={logo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-8 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          {content}
        </a>
      );
    }

    return <div className="flex-shrink-0 px-8">{content}</div>;
  };

  return (
    <section className="border-y bg-card overflow-hidden" aria-label="Customer logos">
      <div className="py-8">
        {heading && (
          <h3 className="text-center text-sm md:text-base text-muted-foreground mb-8 px-6">
            {heading}
          </h3>
        )}
        
        <div
          className="relative flex overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* First set of logos */}
          <div
            className={`flex items-center ${isPaused ? '' : 'animate-marquee'}`}
            style={isPaused ? { animationPlayState: 'paused' } : {}}
          >
            {logos.map((logo, index) => (
              <LogoItem key={`logo-1-${index}`} logo={logo} />
            ))}
          </div>
          
          {/* Duplicate set for seamless loop */}
          <div
            className={`flex items-center ${isPaused ? '' : 'animate-marquee'}`}
            style={isPaused ? { animationPlayState: 'paused' } : {}}
            aria-hidden="true"
          >
            {logos.map((logo, index) => (
              <LogoItem key={`logo-2-${index}`} logo={logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoCarousel;
