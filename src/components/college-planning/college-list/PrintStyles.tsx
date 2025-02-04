
export default function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          @page {
            size: landscape;
            margin: 5mm;
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
            margin-bottom: 0.5rem;
            border-bottom: 1px solid #ddd;
            padding: 0.25rem;
          }

          .profile-section h3 {
            font-size: 0.85rem;
            margin-bottom: 0.25rem;
          }

          .profile-section dl {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.25rem;
            font-size: 0.7rem;
          }

          .profile-section dt {
            font-size: 0.65rem;
          }

          .profile-section dd {
            font-size: 0.65rem;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            table-layout: fixed;
          }
          
          th, td {
            padding: 2px;
            border: 1px solid #ddd;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          th {
            font-size: 7.5px;
          }

          th:nth-child(1), td:nth-child(1) { width: 10%; } /* College Name */
          th:nth-child(2), td:nth-child(2) { width: 8%; }  /* Major */
          th:nth-child(3), td:nth-child(3) { width: 6%; }  /* Degree */
          th:nth-child(4), td:nth-child(4) { width: 7%; }  /* Category */
          th:nth-child(5), td:nth-child(5) { width: 15%; } /* College URL */
          th:nth-child(6), td:nth-child(6) { width: 7%; }  /* Type */
          th:nth-child(7), td:nth-child(7) { width: 6%; }  /* State */
          th:nth-child(8), td:nth-child(8) { width: 5%; }  /* GPA */
          th:nth-child(9), td:nth-child(9) { width: 6%; }  /* SAT */
          th:nth-child(10), td:nth-child(10) { width: 6%; } /* ACT */
          th:nth-child(11), td:nth-child(11) { width: 7%; } /* Test Optional */
          th:nth-child(12), td:nth-child(12) { width: 17%; } /* Notes */

          td a {
            word-break: break-all;
            font-size: 8px;
            color: #0066cc !important;
            text-decoration: none;
          }
          
          .print\\:hidden {
            display: none !important;
          }

          td > div.max-w-[200px] {
            max-width: none !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .bg-red-500, .bg-orange-500, .bg-yellow-500, .bg-green-500, .bg-blue-500 {
            color: black !important;
            background-color: transparent !important;
            border: 1px solid #666;
            padding: 1px 2px;
          }
        }
      `}
    </style>
  );
}
