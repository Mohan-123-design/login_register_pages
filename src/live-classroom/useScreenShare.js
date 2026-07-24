import { useState, useRef, useEffect, useCallback } from "react";
export default function useScreenShare(socket, roomId, myUserId, participants) {
  var [activeSharerId, setActiveSharerId] = useState(null);
  var [localStream, setLocalStream] = useState(null);
  var [remoteStream, setRemoteStream] = useState(null);
  var [sharerName, setSharerName] = useState(null);
  var peersRef = useRef(new Map());
  var localStreamRef = useRef(null);
  var cleanupPeers = useCallback(function () {
    peersRef.current.forEach(function (pc) {
      pc.close();
    });
    peersRef.current.clear();
  }, []);

  var stopScreenShare = useCallback(
    function () {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(function (t) {
          t.stop();
        });
        localStreamRef.current = null;
        setLocalStream(null);
      }

      if (socket) {
        socket.emit("screenShare:stop", { roomId: roomId });
      }

      cleanupPeers();
      setActiveSharerId(null);
      setSharerName(null);
    },
    [socket, roomId, cleanupPeers],
  );

  var createPeer = useCallback(
    function (targetUserId) {
      if (peersRef.current.has(targetUserId))
        return peersRef.current.get(targetUserId);
      var pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.onicecandidate = function (event) {
        if (event.candidate && socket) {
          socket.emit("webrtc:screen:ice-candidate", {
            roomId: roomId,
            targetUserId: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = function (event) {
        setRemoteStream(event.streams[0]);
      };

      peersRef.current.set(targetUserId, pc);
      return pc;
    },
    [socket, roomId],
  );

  var startScreenShare = useCallback(
    async function () {
      if (!socket) return;
      try {
        var stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        stream.getVideoTracks()[0].onended = function () {
          stopScreenShare();
        };

        localStreamRef.current = stream;
        setLocalStream(stream);

        socket.emit("screenShare:start", { roomId: roomId }, function (res) {
          if (!res.ok) {
            alert(res.error || "Failed to start screen share");
            stopScreenShare();
            return;
          }

          setActiveSharerId(myUserId);
          setSharerName("You");
          Object.keys(participants).forEach(async function (uid) {
            if (uid !== myUserId && participants[uid].status === "active") {
              var pc = createPeer(uid);
              stream.getTracks().forEach(function (track) {
                pc.addTrack(track, stream);
              });
              var offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("webrtc:screen:offer", {
                roomId: roomId,
                targetUserId: uid,
                sdp: offer,
              });
            }
          });
        });
      } catch (err) {
        if (err.name !== "NotAllowedError") {
          console.error("Screen share error:", err);
          alert("Could not start screen sharing: " + err.message);
        }
      }
    },
    [socket, roomId, myUserId, participants, stopScreenShare, createPeer],
  );
  useEffect(
    function () {
      if (activeSharerId === myUserId && localStreamRef.current && socket) {
        Object.keys(participants).forEach(async function (uid) {
          if (
            uid !== myUserId &&
            participants[uid].status === "active" &&
            !peersRef.current.has(uid)
          ) {
            var pc = createPeer(uid);
            var stream = localStreamRef.current;
            stream.getTracks().forEach(function (track) {
              pc.addTrack(track, stream);
            });
            var offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc:screen:offer", {
              roomId: roomId,
              targetUserId: uid,
              sdp: offer,
            });
          }
        });
      }
    },
    [participants, activeSharerId, myUserId, socket, roomId, createPeer],
  );
  useEffect(
    function () {
      if (!socket) return;

      var onScreenShareStarted = function (data) {
        setActiveSharerId(data.userId);
        setSharerName(data.name || data.userId);
      };

      var onScreenShareStopped = function (data) {
        if (
          data.userId === activeSharerId ||
          data.userId === localStreamRef.current?.senderId
        )
          setActiveSharerId(null);
        setSharerName(null);
        setRemoteStream(null);
        cleanupPeers();
      };

      var onOffer = async function (data) {
        var pc = createPeer(data.senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        var answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:screen:answer", {
          roomId: roomId,
          targetUserId: data.senderId,
          sdp: answer,
        });
      };

      var onAnswer = async function (data) {
        var pc = peersRef.current.get(data.senderId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      };

      var onIceCandidate = async function (data) {
        var pc = peersRef.current.get(data.senderId);
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      };

      socket.on("screenShare:started", onScreenShareStarted);
      socket.on("screenShare:stopped", onScreenShareStopped);
      socket.on("webrtc:screen:offer", onOffer);
      socket.on("webrtc:screen:answer", onAnswer);
      socket.on("webrtc:screen:ice-candidate", onIceCandidate);

      return function () {
        socket.off("screenShare:started", onScreenShareStarted);
        socket.off("screenShare:stopped", onScreenShareStopped);
        socket.off("webrtc:screen:offer", onOffer);
        socket.off("webrtc:screen:answer", onAnswer);
        socket.off("webrtc:screen:ice-candidate", onIceCandidate);
      };
    },
    [socket, roomId, activeSharerId, createPeer, cleanupPeers],
  );

  useEffect(
    function () {
      return function () {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(function (t) {
            t.stop();
          });
        }
        cleanupPeers();
      };
    },
    [cleanupPeers],
  );

  return {
    activeSharerId: activeSharerId,
    sharerName: sharerName,
    localStream: localStream,
    remoteStream: remoteStream,
    startScreenShare: startScreenShare,
    stopScreenShare: stopScreenShare,
  };
}
