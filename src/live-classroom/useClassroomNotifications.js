import { useEffect } from "react";
import { toastManager } from "./NotificationToast.jsx";

export default function useClassroomNotifications(socketRef, isTrainer) {
  useEffect(
    function () {
      var sock = socketRef && socketRef.current;
      if (!sock) return;

      var onJoined = function (data) {
        toastManager.addToast(data.name + " joined the session", "info");
      };

      var onLeft = function (data) {
        toastManager.addToast(data.name + " left the session", "info");
      };

      var onRemoved = function (data) {
        if (isTrainer) {
          toastManager.addToast(
            (data.name || data.userId) + " was removed",
            "warning",
          );
        }
      };

      var onYouWereRemoved = function () {
        toastManager.addToast("You were removed from the session", "error");
      };

      var onHandUpdated = function (data) {
        if (data.raised && isTrainer) {
          toastManager.addToast(
            (data.name || data.userId) + " raised their hand",
            "info",
          );
        }
      };

      var onHandApproved = function () {
        toastManager.addToast("Your hand was approved to speak", "success");
      };

      var onHandDismissed = function () {
        toastManager.addToast("Your hand was dismissed", "info");
      };

      var onHandDenied = function (data) {
        toastManager.addToast(
          "Hand raise denied: " + (data.reason || "permission revoked"),
          "error",
        );
      };

      var onMicMuted = function () {
        toastManager.addToast("You were muted by the trainer", "warning");
      };

      var onSessionLocked = function () {
        toastManager.addToast("Session locked", "warning");
      };

      var onSessionUnlocked = function () {
        toastManager.addToast("Session unlocked", "success");
      };

      var onSessionEnded = function () {
        toastManager.addToast("The trainer ended the session", "error");
      };

      var onScreenShareError = function (data) {
        toastManager.addToast(data.reason || "Screen share failed", "error");
      };

      sock.on("participant:joined", onJoined);
      sock.on("participant:left", onLeft);
      sock.on("participant:removed", onRemoved);
      sock.on("participant:you-were-removed", onYouWereRemoved);
      sock.on("hand:updated", onHandUpdated);
      sock.on("hand:approved", onHandApproved);
      sock.on("hand:dismissed", onHandDismissed);
      sock.on("hand:denied", onHandDenied);
      sock.on("mic:mutedByTrainer", onMicMuted);
      sock.on("session:locked", onSessionLocked);
      sock.on("session:unlocked", onSessionUnlocked);
      sock.on("session:ended", onSessionEnded);
      sock.on("screenShare:error", onScreenShareError);

      return function () {
        sock.off("participant:joined", onJoined);
        sock.off("participant:left", onLeft);
        sock.off("participant:removed", onRemoved);
        sock.off("participant:you-were-removed", onYouWereRemoved);
        sock.off("hand:updated", onHandUpdated);
        sock.off("hand:approved", onHandApproved);
        sock.off("hand:dismissed", onHandDismissed);
        sock.off("hand:denied", onHandDenied);
        sock.off("mic:mutedByTrainer", onMicMuted);
        sock.off("session:locked", onSessionLocked);
        sock.off("session:unlocked", onSessionUnlocked);
        sock.off("session:ended", onSessionEnded);
        sock.off("screenShare:error", onScreenShareError);
      };
    },
    [socketRef, isTrainer],
  );
}
