import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, User } from "lucide-react";
import { Metadata } from "next";
import { SlideButton } from "@/components/ui/SlideButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from('events').select('title').eq('id', id).single();
  
  if (!event) return { title: "Event Not Found" };
  return { title: `${event.title} | Campus Events` };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single();

  if (!event) {
    notFound();
  }

  // Fetch registration count to determine if full
  const { count } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id);

  const isFull = event.seats !== null && count !== null ? count >= event.seats : false;

  // Check if current user is already registered
  const { data: { user } } = await supabase.auth.getUser();
  let userRegistration = null;
  if (user) {
    const { data: reg } = await supabase
      .from('registrations')
      .select('status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single();
    if (reg) userRegistration = reg;
  }


  return (
    <div className="min-h-screen bg-white pb-20 font-sans">


      {/* Banner */}
      <div className="w-full h-[40vh] fixed top-0 left-0 z-0">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient that fades image into the background color */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/40 to-white" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full mt-[30vh]">
        {/* Smooth transition overlapping the bottom of the image */}
        <div className="w-full h-[10vh] bg-gradient-to-b from-white/0 to-white" />

        <div className="bg-white w-full min-h-screen pt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 items-start">

              {/* Left Details - No Card Background */}
              <div className="flex-1 pb-12">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                  {event.title}
                </h1>

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {event.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-4 py-1.5 bg-gray-200/50 text-gray-700 text-sm font-semibold rounded-full uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="prose prose-lg max-w-none text-gray-700 mb-10 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </div>

                <hr className="border-gray-200 mb-8" />

                {/* Organizer Details */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Organizer</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                      <User className="text-gray-400" size={28} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">{event.organizer || "Campus Event Team"}</p>
                      <p className="text-gray-500 font-medium">Event Organizer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Card */}
              <div className="w-full lg:w-[380px] lg:mt-2">
                <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-[#E5E5EA] shadow-sm flex flex-col gap-8">

                  <div>
                    <h3 className="text-xl font-bold text-[#111111] mb-6">Event Details</h3>
                    <div className="flex flex-col gap-5">

                      {/* Date */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[12px] bg-[#cfe467]/20 flex items-center justify-center shrink-0">
                          <Calendar size={20} className="text-[#111111]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[13px] font-medium text-[#6E6E73] mb-0.5">Date</span>
                          <span className="text-[15px] font-semibold text-[#111111]">{event.date}</span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[12px] bg-[#cfe467]/20 flex items-center justify-center shrink-0">
                          <Clock size={20} className="text-[#111111]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[13px] font-medium text-[#6E6E73] mb-0.5">Time</span>
                          <span className="text-[15px] font-semibold text-[#111111]">{event.time}</span>
                        </div>
                      </div>

                      {/* Venue */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[12px] bg-[#cfe467]/20 flex items-center justify-center shrink-0">
                          <MapPin size={20} className="text-[#111111]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[13px] font-medium text-[#6E6E73] mb-0.5">Venue</span>
                          <span className="text-[15px] font-semibold text-[#111111]">{event.venue}</span>
                        </div>
                      </div>

                      {/* Fee */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[12px] bg-[#cfe467]/20 flex items-center justify-center shrink-0">
                          <Ticket size={20} className="text-[#111111]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[13px] font-medium text-[#6E6E73] mb-0.5">Registration Fee</span>
                          <span className="text-[15px] font-semibold text-[#111111]">
                            {event.price === 'paid' ? (event.priceAmount ? `₹${event.priceAmount}` : 'Paid') : 'Free'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="pt-2">
                    <SlideButton
                      event={event}
                      isFull={isFull}
                      userRegistration={userRegistration}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
