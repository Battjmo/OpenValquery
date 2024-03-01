"use client";
import { useState, useEffect } from "react";

interface VideoCompnentProps {
  src: string;
  poster: string;
  preload: string;
}

export const Video = (props: VideoCompnentProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const { src, poster, preload } = props;
  if (isClient)
    return (
      <video controls poster={poster} preload={preload} className="">
        <source src={src} type="video/mp4" />
      </video>
    );
};
