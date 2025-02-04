
export default function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
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
            margin-bottom: 1rem;
            border-bottom: 1px solid #ddd;
            padding: 0.5rem;
          }

          .profile-section h3 {
            font-size: 1rem;
            margin-bottom: 0.5rem;
          }

          .profile-section dl {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
            font-size: 0.75rem;
          }

          .profile-section dt {
            font-size: 0.7rem;
          }

          .profile-section dd {
            font-size: 0.7rem;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          
          th, td {
            padding: 4px;
            border: 1px solid #ddd;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
          }

          td a {
            word-break: break-all;
            font-size: 9px;
          }
          
          .print\\:hidden {
            display: none !important;
          }

          td > div.max-w-[200px] {
            max-width: 150px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}
    </style>
  );
}
