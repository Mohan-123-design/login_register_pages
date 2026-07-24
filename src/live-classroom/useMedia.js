import { useState, useRef, useCallback, useEffect } from "react";

/**
 * @returns {{
 *   audioTrack: MediaStreamTrack | null,
 *   micOn: boolean,
 *   toggleMic: () => Promise<boolean>,
 *   setMicEnabled: (on: boolean) => void,
 *   cleanupMedia: () => void,
 * }}
 */
export default function useMedia() {
  var [micOn, setMicOn] = useState(false);
  var [cameraOn, setCameraOn] = useState(false);
  var audioStreamRef = useRef(null);
  var audioTrackRef = useRef(null);
  var videoStreamRef = useRef(null);
  var videoTrackRef = useRef(null);
  var ensureAudioStream = useCallback(async function () {
    if (audioStreamRef.current) return audioStreamRef.current;
    try {
      var stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      audioStreamRef.current = stream;
      var track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = false;
        audioTrackRef.current = track;
      }
      return stream;
    } catch (err) {
      console.error("[useMedia] getUserMedia audio failed:", err.message);
      return null;
    }
  }, []);
  var ensureVideoStream = useCallback(async function () {
    if (videoStreamRef.current) return videoStreamRef.current;
    try {
      var stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      videoStreamRef.current = stream;
      var track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = false;
        videoTrackRef.current = track;
      }
      return stream;
    } catch (err) {
      console.error("[useMedia] getUserMedia video failed:", err.message);
      return null;
    }
  }, []);
  var toggleMic = useCallback(
    async function () {
      var stream = await ensureAudioStream();
      if (!stream) return false;
      var track = audioTrackRef.current;
      if (!track) return false;
      var newState = !track.enabled;
      track.enabled = newState;
      setMicOn(newState);
      return newState;
    },
    [ensureAudioStream],
  );
  var toggleCamera = useCallback(
    async function () {
      var stream = await ensureVideoStream();
      if (!stream) return false;
      var track = videoTrackRef.current;
      if (!track) return false;
      var newState = !track.enabled;
      track.enabled = newState;
      setCameraOn(newState);
      return newState;
    },
    [ensureVideoStream],
  );
  var setMicEnabled = useCallback(function (on) {
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = !!on;
    }
    setMicOn(!!on);
  }, []);
  var setCameraEnabled = useCallback(function (on) {
    if (videoTrackRef.current) {
      videoTrackRef.current.enabled = !!on;
    }
    setCameraOn(!!on);
  }, []);
  var cleanupMedia = useCallback(function () {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(function (t) {
        t.stop();
      });
      audioStreamRef.current = null;
      audioTrackRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(function (t) {
        t.stop();
      });
      videoStreamRef.current = null;
      videoTrackRef.current = null;
    }
    setMicOn(false);
    setCameraOn(false);
  }, []);
  useEffect(
    function () {
      return cleanupMedia;
    },
    [cleanupMedia],
  );

  return {
    audioTrack: audioTrackRef.current,
    videoTrack: videoTrackRef.current,
    videoStream: videoStreamRef.current,
    micOn: micOn,
    cameraOn: cameraOn,
    toggleMic: toggleMic,
    toggleCamera: toggleCamera,
    setMicEnabled: setMicEnabled,
    setCameraEnabled: setCameraEnabled,
    cleanupMedia: cleanupMedia,
  };
}
