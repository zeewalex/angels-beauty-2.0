import { ArrowRight } from "lucide-react";
import { SectionLabel } from "./ui-bits";

export function OurStoryBanner() {
  return (
    <section id="about" className="bg-cream py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-2xl bg-forest lg:grid-cols-2">
          {/* text */}
          <div className="relative flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <SectionLabel tone="white">Our Story</SectionLabel>
            <h2 className="mt-4 font-serif text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
              More Than Beauty,
              <span className="block text-blush">It&apos;s Self Care</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/75">
              At Angels Beauty, we believe beauty is not just about looking
              good — it&apos;s about feeling confident, empowered and connected
              to nature. Every product is crafted with clean ingredients and
              real care for your skin.
            </p>
            <div className="mt-6">
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-full border border-blush/50 px-5 py-2.5 text-sm font-semibold text-blush transition-colors hover:bg-blush hover:text-forest"
              >
                Learn More
                <ArrowRight size={15} />
              </a>
            </div>
          </div>

          {/* image */}
          <div className="relative min-h-[260px] overflow-hidden sm:min-h-[340px]">
            <img
              src="/images/banner-ourstory.png"
              alt="Angels Beauty skincare bottles on a stone surface with green leaves"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            {/* circular stamp — overlapping the photo's right edge, vertically centered */}
            <div className="absolute right-4 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-full border-2 border-blush/70 bg-forest/85 text-center shadow-lg backdrop-blur sm:h-28 sm:w-28">
              <div className="leading-tight">
                <p className="font-script text-base text-blush sm:text-lg">Clean</p>
                <p className="font-script text-base text-blush sm:text-lg">Natural</p>
                <p className="font-script text-base text-blush sm:text-lg">Effective</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
