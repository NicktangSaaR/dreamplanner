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

          .profile-section {
            margin-bottom: 2rem;
            border-bottom: 1px solid #ddd;
            padding-bottom: 1rem;
          }

          .profile-section h3 {
            font-size: 1.2rem;
            margin-bottom: 1rem;
          }

          .profile-section dl {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
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