import { useRef, useState } from "react";
import Barcode from "react-barcode";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import src from "@/assets/logo2.jpg"; // Import your logo image

const PrintBarcodeModal = ({ product, isOpen, onClose }: any) => {
  const [numberOfBarcodes, setNumberOfBarcodes] = useState(1);
  const barcodeRefs = useRef<any[]>([]); // Array of refs for multiple barcodes

  // Handle Print Function
  const handlePrint = () => {
    const printWindow = window.open("", "Print", "width=600,height=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 5px;
              margin: 0;
            }
            .barcode-container {
              margin: 0;
              padding: 0;
              line-height: 0;
            }
            .header {
              text-align: center;
              margin: 0;
              padding: 0;
            }
            .company-info {
              font-size: 14px;
              color: #555;
              margin: 0;
              padding: 0;
            }
            .barcode {
              margin: 0;
              padding: 0;
              display: block;
            }
            .product-name {
              font-size: 14px;
              font-weight: bold;
              color: #333;
              margin: 0 0 2px 0;  /* Small 2px gap - change to 0 for no gap */
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="product-name">
              ${product?.name || "stock management"}
            </p>
          </div>
          ${Array(product.isUnique ? 1 : numberOfBarcodes)
            .fill("")
            .map(
              (_, index) =>
                `<div class="barcode-container">
                  <svg id="barcode-${index}" class="barcode"></svg>
                </div>`
            )
            .join("")}
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              ${Array(product.isUnique ? 1 : numberOfBarcodes)
                .fill("")
                .map(
                  (_, index) => `JsBarcode("#barcode-${index}", "${product?.barcode}", {
                      format: "CODE128",
                      width: 2,
                      height: 80,
                      displayValue: true
                    });`
                )
                .join("")}
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center overflow-auto justify-center">
          <Dialog.Panel className="bg-white p-6 rounded-md max-w-xl w-full">
            <Dialog.Title className="text-xl font-bold">Print Barcodes</Dialog.Title>
            <div className="mt-4">
              <p className="text-gray-700">
                Product: <strong>{product?.name}</strong>
              </p>
              <p className="text-gray-700">
                Barcode: <strong>{product?.barcode}</strong>
              </p>
            </div>
            {!product.isUnique && (
              <div className="mt-4">
                <label className="block font-semibold text-gray-700">
                  Number of Barcodes
                </label>
                <input
                  type="number"
                  min={1}
                  value={numberOfBarcodes}
                  onChange={(e) => setNumberOfBarcodes(Math.max(1, Number(e.target.value)))}
                  className="mt-1 block w-full p-2 border rounded-md"
                />
              </div>
            )}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {Array(product.isUnique ? 1 : numberOfBarcodes)
                .fill("")
                .map((_, index) => (
                  <div
                    key={index}
                    className="border p-2 mx-auto"
                    ref={(el) => (barcodeRefs.current[index] = el)}
                  >
                    <Barcode
                      value={product?.barcode || ""}
                      format="CODE128"
                      width={1}
                      height={34}
                      fontSize={13}
                      displayValue
                    />
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={onClose} className="btn btn-outline px-4 py-2 rounded-md">
                Cancel
              </button>
              <button onClick={handlePrint} className="btn btn-primary px-4 py-2 rounded-md">
                Print Barcode
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PrintBarcodeModal;