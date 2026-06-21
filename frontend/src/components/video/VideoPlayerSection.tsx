import { VideoDeviceFrame } from '@/components/video/VideoDeviceFrame';

type VideoPlayerSectionProps = {
  youtubeVideoId: string;
  title: string;
};

export function VideoPlayerSection({ youtubeVideoId, title }: VideoPlayerSectionProps) {
  const embedSrc = `https://www.youtube.com/embed/${youtubeVideoId}`;
  const player = (
    <iframe
      src={embedSrc}
      title={title}
      className="aspect-video w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );

  return (
    <>
      <div className="flex justify-center lg:hidden">
        <VideoDeviceFrame variant="phone" label="모바일 시청" className="w-full max-w-[17rem]">
          {player}
        </VideoDeviceFrame>
      </div>
      <div className="hidden lg:block">
        <VideoDeviceFrame variant="desktop" label="PC 시청" className="mx-auto max-w-4xl">
          {player}
        </VideoDeviceFrame>
      </div>
    </>
  );
}
