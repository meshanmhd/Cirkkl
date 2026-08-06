import Image from "next/image";

export default function PartnersSection() {
  return (
    <section className="pb-24 pt-24 px-6 bg-white" id="partners">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#cfe467]" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#6E6E73]">
            Community Partners
          </p>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] mb-12">
          Backed by the best
        </h2>

        {/* Logos Container - Flex column on mobile, row on desktop */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-12 sm:gap-24 opacity-60 hover:opacity-100 transition-opacity duration-500">
          
          {/* 
            TODO for User: Replace these text placeholders with real Image tags. 
            Example:
            <Image src="/partners/partner-1.png" alt="Partner 1" width={120} height={40} className="object-contain" />
          */}
          
          <div className="text-2xl font-black tracking-tighter text-[#111111]">PARTNER ONE</div>
          <div className="text-2xl font-black tracking-tighter text-[#111111]">PARTNER TWO</div>
          <div className="text-2xl font-black tracking-tighter text-[#111111]">PARTNER THREE</div>
          <div className="text-2xl font-black tracking-tighter text-[#111111]">PARTNER FOUR</div>
          
        </div>
      </div>
    </section>
  );
}
