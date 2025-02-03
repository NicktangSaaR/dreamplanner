export default function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          @page {
            size: landscape;
            margin: 20mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-section,
          .print-section * {
            visibility: visible !important;
          }
          
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
      `}
    </style>
  );
}