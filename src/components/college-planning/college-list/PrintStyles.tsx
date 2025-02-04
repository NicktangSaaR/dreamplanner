
export default function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          @page {
            size: landscape;
            margin: 3mm;
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
            margin-bottom: 0.25rem;
            border-bottom: 1px solid #ddd;
            padding: 0.25rem;
          }

          .profile-section h3 {
            font-size: 0.75rem;
            margin-bottom: 0.25rem;
          }

          .profile-section dl {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.25rem;
            font-size: 0.6rem;
          }

          .profile-section dt {
            font-size: 0.6rem;
          }

          .profile-section dd {
            font-size: 0.6rem;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            table-layout: fixed;
          }
          
          th, td {
            padding: 1px;
            border: 1px solid #ddd;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.1;
          }

          th {
            font-size: 7px;
            font-weight: bold;
          }

          th:nth-child(1), td:nth-child(1) { width: 15%; } /* College Name */
          th:nth-child(2), td:nth-child(2) { width: 15%; } /* Major */
          th:nth-child(4), td:nth-child(4) { width: 8%; }  /* Category */
          th:nth-child(6), td:nth-child(6) { width: 8%; }  /* Type */
          th:nth-child(7), td:nth-child(7) { width: 8%; }  /* State */
          th:nth-child(8), td:nth-child(8) { width: 7%; }  /* GPA */
          th:nth-child(9), td:nth-child(9) { width: 7%; }  /* SAT */
          th:nth-child(10), td:nth-child(10) { width: 7%; } /* ACT */
          th:nth-child(11), td:nth-child(11) { width: 8%; } /* Test Optional */
          th:nth-child(12), td:nth-child(12) { width: 17%; } /* Notes */

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

          .print:hidden {
            display: none !important;
          }
        }
      `}
    </style>
  );
}

