import { useState, useRef, useEffect, useCallback } from "react";
/**
 * @param {import("socket.io-client").Socket|null} socket
 * @param {string} roomId
 * @param {string} myUserId
 * @param {Object} participants 
 * @param {{audioTrack: MediaStreamTrack|null, videoTrack: MediaStreamTrack|null, micOn: boolean, cameraOn: boolean}} media - the object returned by useMedia()
 * @returns {{ remoteStreams: Object.<string, MediaStream> }}
 */
export default function useCameraStreams(socket, roomId, myUserId, participants, media) {
  var [remoteStreams, setRemoteStreams] = useState({});
  var peersRef = useRef(new Map());
  var metaRef = useRef(new Map());
  var removePeer = useCallback(function (targetUserId) {
    var pc = peersRef.current.get(targetUserId);
    if (pc) {
      pc.close();
      peersRef.current.delete(targetUserId);
    }
    metaRef.current.delete(targetUserId);
    setRemoteStreams(function (prev) {
      if (!prev[targetUserId]) return prev;
      var next = Object.assign({}, prev);
      delete next[targetUserId];
      return next;
    });
  }, []);

  var cleanupAllPeers = useCallback(function () {
    peersRef.current.forEach(function (pc) {
      pc.close();
    });
    peersRef.current.clear();
    metaRef.current.clear();
    setRemoteStreams({});
  }, []);

  var createPeer = useCallback(
    function (targetUserId) {
      if (peersRef.current.has(targetUserId)) return peersRef.current.get(targetUserId);

      var pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      var meta = {
        polite: myUserId < targetUserId,
        makingOffer: false,
        ignoreOffer: false,
      };
      metaRef.current.set(targetUserId, meta);

      pc.onnegotiationneeded = async function () {
        try {
          meta.makingOffer = true;
          await pc.setLocalDescription();
          socket.emit("webrtc:cam:offer", {
            roomId: roomId,
            targetUserId: targetUserId,
            sdp: pc.localDescription,
          });
        } catch (err) {
          console.error("[useCameraStreams] negotiation error:", err);
        } finally {
          meta.makingOffer = false;
        }
      };

      pc.onicecandidate = function (event) {
        if (event.candidate) {
          socket.emit("webrtc:cam:ice-candidate", {
            roomId: roomId,
            targetUserId: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = function (event) {
        setRemoteStreams(function (prev) {
          var next = Object.assign({}, prev);
          var combined = next[targetUserId] || new MediaStream();
          combined
            .getTracks()
            .filter(function (t) {
              return t.kind === event.track.kind;
            })
            .forEach(function (t) {
              combined.removeTrack(t);
            });
          combined.addTrack(event.track);
          next[targetUserId] = combined;
          return next;
        });
      };

      pc.onconnectionstatechange = function () {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          removePeer(targetUserId);
        }
      };

      peersRef.current.set(targetUserId, pc);
      return pc;
    },
    [socket, roomId, myUserId, removePeer],
  );
  var syncTracks = useCallback(
    function (pc) {
      var senders = pc.getSenders();
      var audioTrack = media.audioTrack;
      var videoTrack = media.videoTrack;
      if (audioTrack && !senders.some(function (s) { return s.track === audioTrack; })) {
        pc.addTrack(audioTrack, new MediaStream([audioTrack]));
      }
      if (videoTrack && !senders.some(function (s) { return s.track === videoTrack; })) {
        pc.addTrack(videoTrack, new MediaStream([videoTrack]));
      }
    },
    [media.audioTrack, media.videoTrack],
  );
  useEffect(
    function () {
      if (!socket) return;
      Object.keys(participants).forEach(function (uid) {
        if (uid !== myUserId && participants[uid].status === "active") {
          var pc = createPeer(uid);
          syncTracks(pc);
        }
      });
    },
    [participants, socket, myUserId, createPeer, syncTracks, media.micOn, media.cameraOn],
  );
  useEffect(
    function () {
      peersRef.current.forEach(function (_pc, uid) {
        var p = participants[uid];
        if (!p || p.status !== "active") {
          removePeer(uid);
        }
      });
    },
    [participants, removePeer],
  );

  useEffect(
    function () {
      if (!socket) return;

      var onOffer = async function (data) {
        var pc = createPeer(data.senderId);
        var meta = metaRef.current.get(data.senderId);
        var offerCollision =
          data.sdp.type === "offer" &&
          (meta.makingOffer || pc.signalingState !== "stable");

        meta.ignoreOffer = !meta.polite && offerCollision;
        if (meta.ignoreOffer) return;

        try {
          await pc.setRemoteDescription(data.sdp);
          if (data.sdp.type === "offer") {
            syncTracks(pc);
            await pc.setLocalDescription();
            socket.emit("webrtc:cam:answer", {
              roomId: roomId,
              targetUserId: data.senderId,
              sdp: pc.localDescription,
            });
          }
        } catch (err) {
          console.error("[useCameraStreams] offer handling error:", err);
        }
      };

      var onAnswer = async function (data) {
        var pc = peersRef.current.get(data.senderId);
        if (pc) {
          try {
            await pc.setRemoteDescription(data.sdp);
          } catch (err) {
            console.error("[useCameraStreams] answer handling error:", err);
          }
        }
      };

      var onIceCandidate = async function (data) {
        var pc = peersRef.current.get(data.senderId);
        if (pc && data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            var meta = metaRef.current.get(data.senderId);
            if (!meta || !meta.ignoreOffer) {
              console.error("[useCameraStreams] ICE candidate error:", err);
            }
          }
        }
      };

      socket.on("webrtc:cam:offer", onOffer);
      socket.on("webrtc:cam:answer", onAnswer);
      socket.on("webrtc:cam:ice-candidate", onIceCandidate);

      return function () {
        socket.off("webrtc:cam:offer", onOffer);
        socket.off("webrtc:cam:answer", onAnswer);
        socket.off("webrtc:cam:ice-candidate", onIceCandidate);
      };
    },
    [socket, roomId, createPeer, syncTracks],
  );

  useEffect(
    function () {
      return cleanupAllPeers;
    },
    [cleanupAllPeers],
  );

  return { remoteStreams: remoteStreams };
}