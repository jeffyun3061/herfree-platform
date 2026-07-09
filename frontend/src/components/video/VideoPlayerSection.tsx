type VideoPlayerSectionProps = {
  youtubeVideoId: string;
  title: string;
};

export function VideoPlayerSection({ youtubeVideoId, title }: VideoPlayerSectionProps) {
  const embedSrc = `https://www.youtube.com/embed/${youtubeVideoId}`;

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E7DFD2] bg-black shadow-[0_12px_28px_-22px_rgba(7,37,31,.45)]">
      <iframe
        src={embedSrc}
        title={title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
