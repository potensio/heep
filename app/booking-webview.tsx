import { WebViewScreen } from "@/src/components/ui";

const HIDE_ELEMENT_SCRIPT = `
  (function() {
    function hideElement() {
      var el = document.getElementById('ff093436');
      if (el) el.style.display = 'none';
    }
    hideElement();
    var observer = new MutationObserver(hideElement);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

export default function BookingWebView() {
  return (
    <WebViewScreen
      url="https://www.swiss-belhotel.com/"
      injectedJavaScript={HIDE_ELEMENT_SCRIPT}
    />
  );
}
