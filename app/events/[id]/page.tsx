import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, User, Users, Globe, ExternalLink, Info, ShieldCheck, Banknote, Camera } from "lucide-react";
import { Metadata } from "next";
import { SlideButton } from "@/components/ui/SlideButton";
import { format, parse } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  // Fetch hosts
  let eventHosts: { id: string; name: string; avatar_url: string }[] = [];
  if (event.hosts && event.hosts.length > 0) {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from('members')
      .select('id, name:full_name, avatar_url')
      .in('id', event.hosts);
    if (data) eventHosts = data as any;
  }

  // Format Dates and Times
  let formattedDate = event.date;
  let formattedEndDate = event.end_date;
  let formattedTime = event.time;
  let formattedEndTime = event.end_time;
  let formattedRegDate = event.registration_deadline;
  let formattedRegTime = event.registration_end_time;

  try {
    if (event.date) {
      formattedDate = format(new Date(event.date + "T00:00:00"), "dd/MM/yy");
    }
    if (event.end_date) {
      formattedEndDate = format(new Date(event.end_date + "T00:00:00"), "dd/MM/yy");
    }
    if (event.registration_deadline) {
      formattedRegDate = format(new Date(event.registration_deadline + "T00:00:00"), "dd/MM/yy");
    }
    if (event.time) {
      const parsed = parse(event.time.substring(0, 5), "HH:mm", new Date());
      formattedTime = format(parsed, "hh:mm a").toLowerCase();
    }
    if (event.end_time) {
      const parsed = parse(event.end_time.substring(0, 5), "HH:mm", new Date());
      formattedEndTime = format(parsed, "hh:mm a").toLowerCase();
    }
    if (event.registration_end_time) {
      const parsed = parse(event.registration_end_time.substring(0, 5), "HH:mm", new Date());
      formattedRegTime = format(parsed, "hh:mm a").toLowerCase();
    }
  } catch (e) {
    console.error("Date parsing error", e);
  }

  // Calculate Event Status
  const now = new Date();
  let eventStart = null;
  let eventEnd = null;
  if (event.date) {
    eventStart = new Date(`${event.date}T${event.time ? event.time : '00:00:00'}`);
  }
  if (event.end_date) {
    eventEnd = new Date(`${event.end_date}T${event.end_time ? event.end_time : '23:59:59'}`);
  } else if (event.date) {
    eventEnd = new Date(`${event.date}T23:59:59`);
  }

  let eventStatus = 'upcoming';
  if (eventStart && eventEnd) {
    if (now < eventStart) eventStatus = 'upcoming';
    else if (now >= eventStart && now <= eventEnd) eventStatus = 'live';
    else eventStatus = 'ended';
  }

  const isEnded = eventStatus === 'ended';

  return (
    <div className="min-h-screen bg-[#F9F9FB] pb-20 font-sans">
      {/* Banner */}
      <div className="w-full h-[45vh] fixed top-0 left-0 z-0">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#F9F9FB]" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full mt-[35vh]">
        <div className="w-full h-[10vh] bg-gradient-to-b from-[#F9F9FB]/0 to-[#F9F9FB]" />

        <div className="bg-[#F9F9FB] w-full min-h-screen pt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

              {/* Left Details */}
              <div className="flex-1 pb-12">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    {eventStatus === 'upcoming' && (
                      <span className="inline-block px-3 py-1 bg-[#E5E5EA] text-[#111111] text-xs font-bold rounded-md uppercase tracking-wider">
                        Upcoming
                      </span>
                    )}
                    {eventStatus === 'live' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-md uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        Live
                      </span>
                    )}
                    {eventStatus === 'ended' && (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-md uppercase tracking-wider">
                        Ended
                      </span>
                    )}
                    {event.category && (
                      <span className="inline-block px-3 py-1 bg-[#cfe467] text-[#111111] text-xs font-bold rounded-md uppercase tracking-wider">
                        {event.category}
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#111111] mb-4 leading-tight">
                    {event.title}
                  </h1>
                  {event.tagline && (
                    <p className="text-xl md:text-2xl text-[#6E6E73] font-medium leading-relaxed">
                      {event.tagline}
                    </p>
                  )}
                </div>

                <div className="prose prose-lg max-w-none text-[#333333] mb-6 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {event.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-[#E5E5EA]/50 text-[#111111] text-xs font-semibold rounded-md uppercase tracking-wide border border-[#E5E5EA]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Speakers Section */}
                {event.speakers && event.speakers.length > 0 && (
                  <>
                    <hr className="border-[#E5E5EA] my-8" />
                    <div className="mb-8">
                      <h3 className="text-2xl font-semibold text-[#111111] mb-5 tracking-tight">
                      {event.speakers.length > 1 ? "Speakers" : "Speaker"}
                    </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {event.speakers.map((speaker: any) => (
                          <div key={speaker.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E5E5EA]">
                            {speaker.imageUrl ? (
                              <img src={speaker.imageUrl} alt={speaker.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-[#F5F5F7] flex items-center justify-center shrink-0">
                                <User className="text-[#9E9EA7]" size={24} />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#111111]">{speaker.name}</p>
                              {speaker.subtext && <p className="text-sm text-[#6E6E73]">{speaker.subtext}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <hr className="border-[#E5E5EA] my-8" />

                {/* Organizer & Hosts Section */}
                <div className="mb-8 flex flex-col gap-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-[#111111] mb-5 tracking-tight">Organized by</h3>
                    <div className="flex flex-wrap gap-10 items-center">
                      
                      {/* Organizer */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center border border-[#E5E5EA] shrink-0">
                          <Users className="text-[#6E6E73]" size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[15px] text-[#111111]">{event.organizer || "Campus Event Team"}</span>
                          <span className="text-[13px] font-medium text-[#6E6E73]">Event Organizer</span>
                        </div>
                      </div>

                      {/* Hosts */}
                      {eventHosts.map((host: any) => (
                        <div key={host.id} className="flex items-center gap-3">
                          <img 
                            src={host.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${host.id}`} 
                            alt={host.name} 
                            className="w-12 h-12 rounded-full object-cover border border-[#E5E5EA] shrink-0 bg-white" 
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-[15px] text-[#111111]">{host.name}</span>
                            <span className="text-[13px] font-medium text-[#6E6E73]">Event Host</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {((event.cancellation_policy && event.cancellation_policy.trim() !== "") ||
                  (event.refund_policy && event.refund_policy.trim() !== "") ||
                  (event.photography_policy && event.photography_policy.trim() !== "")) && (
                    <>
                      <hr className="border-[#E5E5EA] my-8" />
                      <div className="mb-8">
                      <h3 className="text-2xl font-semibold text-[#111111] mb-5 tracking-tight">Policies & Guidelines</h3>
                      <Accordion className="w-full space-y-4">
                        {event.cancellation_policy && event.cancellation_policy.trim() !== "" && (
                          <AccordionItem value="cancellation" className="border border-[#E5E5EA] bg-white rounded-2xl px-5">
                            <AccordionTrigger className="hover:no-underline py-5">
                              <div className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-[#111111]" />
                                <h4 className="font-semibold text-[15px] text-[#111111] tracking-tight">Cancellation Policy</h4>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-[#6E6E73] whitespace-pre-wrap pb-5">
                              {event.cancellation_policy}
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        {event.refund_policy && event.refund_policy.trim() !== "" && (
                          <AccordionItem value="refund" className="border border-[#E5E5EA] bg-white rounded-2xl px-5">
                            <AccordionTrigger className="hover:no-underline py-5">
                              <div className="flex items-center gap-3">
                                <Banknote size={20} className="text-[#111111]" />
                                <h4 className="font-semibold text-[15px] text-[#111111] tracking-tight">Refund Policy</h4>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-[#6E6E73] whitespace-pre-wrap pb-5">
                              {event.refund_policy}
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        {event.photography_policy && event.photography_policy.trim() !== "" && (
                          <AccordionItem value="photography" className="border border-[#E5E5EA] bg-white rounded-2xl px-5">
                            <AccordionTrigger className="hover:no-underline py-5">
                              <div className="flex items-center gap-3">
                                <Camera size={20} className="text-[#111111]" />
                                <h4 className="font-semibold text-[15px] text-[#111111] tracking-tight">Photography Policy</h4>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-[#6E6E73] whitespace-pre-wrap pb-5">
                              {event.photography_policy}
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>
                    </>
                  )}

              </div>

              {/* Right Card */}
              <div className="w-full lg:w-[400px] shrink-0 sticky top-24">
                <div className="bg-white rounded-3xl p-6 lg:p-8 border border-[#E5E5EA] shadow-xl shadow-black/5 flex flex-col gap-8">

                  <div>
                    <h3 className="text-2xl font-semibold text-[#111111] mb-5 tracking-tight">Event Details</h3>
                    <div className="flex flex-col gap-6">

                      {/* Date & Time */}
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-[14px] bg-[#cfe467]/30 flex items-center justify-center shrink-0">
                          <Calendar size={22} className="text-[#111111]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[13px] font-medium text-[#6E6E73] mb-1">Date & Time</span>
                          <span className="text-[15px] font-semibold text-[#111111]">
                            {formattedDate} {formattedTime ? `| ${formattedTime}` : ''} to
                          </span>
                          {(formattedEndDate || formattedEndTime) && (
                            <span className="text-[15px] font-semibold text-[#111111] mt-0.5">
                              {formattedEndDate || formattedDate} {formattedEndTime ? `| ${formattedEndTime}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-[14px] bg-[#cfe467]/30 flex items-center justify-center shrink-0">
                          {event.location_type === 'online' ? (
                            <Globe size={22} className="text-[#111111]" strokeWidth={1.5} />
                          ) : (
                            <MapPin size={22} className="text-[#111111]" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[13px] font-medium text-[#6E6E73] mb-1">Location</span>
                          <span className="text-[15px] font-semibold text-[#111111]">
                            {event.location_type === 'online' ? (event.platform || "Online Event") : (event.venue || event.location)}
                          </span>
                          {event.city && <span className="text-[14px] text-[#6E6E73] mt-0.5">{event.city}</span>}
                          {event.location_link && (
                            <a href={event.location_link} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-[#111111] flex items-center gap-1 mt-1 hover:underline">
                              View Map <ExternalLink size={12} />
                            </a>
                          )}
                          {event.meeting_link && event.location_type !== 'physical' && (
                            <a href={event.meeting_link} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-[#111111] flex items-center gap-1 mt-1 hover:underline">
                              Meeting Link <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Capacity */}
                      {event.seats !== null && (
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-[14px] bg-[#cfe467]/30 flex items-center justify-center shrink-0">
                            <Users size={22} className="text-[#111111]" strokeWidth={1.5} />
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="text-[13px] font-medium text-[#6E6E73] mb-1">Capacity</span>
                            <span className="text-[15px] font-semibold text-[#111111]">
                              {event.seatsAvailable !== null ? event.seatsAvailable : event.seats} / {event.seats} seats available
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tickets Summary */}
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-[14px] bg-[#cfe467]/30 flex items-center justify-center shrink-0">
                          <Ticket size={22} className="text-[#111111]" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col justify-center w-full">
                          <span className="text-[13px] font-medium text-[#6E6E73] mb-1">Registration Type</span>
                          <span className="text-[15px] font-semibold text-[#111111]">
                            {event.price === 'paid' ? 'Paid' : 'Free'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="pt-2">
                    {!isEnded && (
                      <SlideButton
                        event={event}
                        isFull={isFull}
                        userRegistration={userRegistration}
                      />
                    )}
                    {event.registration_deadline && !isEnded && (
                      <p className="text-center text-xs text-[#6E6E73] mt-4 font-medium">
                        Registration closes on {formattedRegDate} {formattedRegTime ? `at ${formattedRegTime}` : ''}
                      </p>
                    )}
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
