export default function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          @page {
            size: landscape;
          }
          body * {
            visibility: hidden;
          }
          .print-section,
          .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
          }
          .print\\:hidden {
            display: none;
          }
        }
      `}
    </style>
  );
}