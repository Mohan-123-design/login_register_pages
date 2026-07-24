import { useState, useEffect } from "react";
import "./NotificationToast.css";
var toastIdSeq = 0;
export var toastManager = {
  addToast: function () {},
};

export default function NotificationToast() {
  var [toasts, setToasts] = useState([]);

  useEffect(function () {
    toastManager.addToast = function (message, type) {
      if (!type) type = "info";
      var id = ++toastIdSeq;
      setToasts(function (prev) {
        return [].concat(prev, [{ id: id, message: message, type: type }]);
      });
      setTimeout(function () {
        setToasts(function (prev) {
          return prev.filter(function (t) {
            return t.id !== id;
          });
        });
      }, 4000);
    };
    return function () {
      toastManager.addToast = function () {};
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="lcr-toast-container">
      {toasts.map(function (toast) {
        return (
          <div key={toast.id} className={"lcr-toast " + toast.type}>
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
