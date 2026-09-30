import { useEffect, useRef, useState } from "react";
import {
  fetchInventoryReport,
  fetchSalesReport,
  fetchBestSellingReport,
} from "@/hooks/api/reports";
import { Empty, Table, ConfigProvider } from "antd";
import type { GetProp, TableColumnsType, TableProps } from "antd";
import type { ColumnType } from "antd/es/table";
import { ImSpinner8 } from "react-icons/im";
import { useTranslation } from "react-i18next";
import { SmileOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianAxis,
  ComposedChart,
  Area,
  Text
} from "recharts";
import Card from "@/components/ui/card";
import { PiMoneyLight } from "react-icons/pi";
import { FaHandHoldingDollar } from "react-icons/fa6";
import { LiaLuggageCartSolid } from "react-icons/lia";
import { exportToExcel, exportToPDF } from "@/utils/exports";
import IconFile from "@/components/Icon/IconFile";
import { useExchangeRate } from "@/hooks/api/exchangeRate";
import { formatCurrency } from "@/utils/formatCurrency";
import DateRangePicker from "@/components/Date/dateRangePicker";
import toast from "react-hot-toast";

interface LowStockItem {
  productName: string;
  quantity: number;
  status: string;
  stockValue: number;
}

const Reports = () => {
  const { t } = useTranslation(); // For translations if needed
  const { rate } = useExchangeRate();
  const [inventoryReport, setInventoryReport] = useState<any>([]);
  const [salesReport, setSalesReport] = useState<any>([]);
  const [bestSellingReport, setBestSellingReport] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("monthly");
  const [dateRangeQuery, setDateRangeQuery] = useState<{ startDate?: string; endDate?: string }>({});
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setError(null);
      try {
        const filterType = query || "";
        const startDate = query === "custom" ? dateRangeQuery?.startDate : undefined;
        const endDate = query === "custom" ? dateRangeQuery?.endDate : undefined;
  
        const [inventory, sales, bestSelling] = await Promise.all([
          fetchInventoryReport(),
          fetchSalesReport({ filterType, startDate, endDate }), // Correct parameter structure
          fetchBestSellingReport({ filterType, startDate, endDate }),
        ]);
  
        setInventoryReport(inventory);
        setSalesReport(sales);
        setBestSellingReport(bestSelling?.data);
      } catch (err) {
        setError(t("reports.errorFetchingReports"));
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchReports();
  }, [t, query, dateRangeQuery]);  
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ImSpinner8 className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const bestSellingData = bestSellingReport.map((item: any) => ({
    name: item.productName,
    quantitySold: item.quantitySold,
    averagePrice: formatCurrency(item.averagePrice, rate),
  }));

  const salesData = salesReport?.topProducts.map((item: any) => ({
    name: item.name,
    quantitySold: item.quantity,
    revenue: formatCurrency(item.revenue, rate),
  }));

  interface DataType {
    productName: string;
    quantity: number;
    status: number;
    stockValue: number;
  }
  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      dataIndex: "index",
    },
    {
      title: t("reports.productName"),
      dataIndex: "productName",
    },
    {
      title: t("reports.quantity"),
      dataIndex: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: t("reports.status"),
      dataIndex: "status",
    },
    {
      title: t("reports.stockValue"),
      dataIndex: "stockValue",
      sorter: (a, b) => a.stockValue - b.stockValue,
    },
  ];

  const onChange: TableProps<DataType>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    console.log("params", pagination, filters, sorter, extra);
  };

  const renderEmpty: GetProp<typeof ConfigProvider, "renderEmpty"> = (
    componentName
  ) => {
    if (componentName === "Table.filter") {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No Filter(Custom)"
        />
      );
    }
  };

  const lowerStock = inventoryReport.lowStockItems.map(
    (item: LowStockItem, index: number) => ({
      index: index + 1,
      productName: item.productName,
      quantity: item.quantity,
      status: item.status,
      stockValue: formatCurrency(item.stockValue, rate),
    })
  );

  const inventory = inventoryReport.inventorySummary.map(
    (item: LowStockItem, index: number) => ({
      index: index + 1,
      productName: item.productName,
      quantity: item.quantity,
      status: item.status,
      stockValue: formatCurrency(item.stockValue, rate),
    })
  );

  const handleExportToExcel = (reportType: "bestSelling" | "inventory") => {
    const exportConfig = {
      bestSelling: {
        data: bestSellingReport.map(
          (
            item: {
              productName: string;
              quantitySold: number;
              status: string;
              totalSales: number;
            },
            index: number
          ) => ({
            index: index + 1,
            productName: item.productName,
            quantity: item.quantitySold,
            status: item.status,
            stockValue: formatCurrency(item.totalSales, rate),
          })
        ),
        sheetName: "Most selling product",
        filename: "Most_Selling",
        columns,
      },
      inventory: {
        data: inventoryReport.inventorySummary,
        sheetName: "Inventory summary",
        filename: "Inventory_summary",
        columns,
      },
    };

    const config = exportConfig[reportType];
    if (config) {
      const formattedColumns = columns
        .filter((col): col is ColumnType<DataType> => "dataIndex" in col)
        .map(({ dataIndex, title }) => ({
          key: dataIndex as string,
          header: title as string,
        }));
      exportToExcel(
        config.data,
        config.sheetName,
        config.filename,
        formattedColumns
      );
    }
  };

  const handleExportToPdf = (reportType: "bestSelling" | "inventory") => {
    const exportConfig = {
      bestSelling: {
        data: bestSellingReport.map(
          (
            item: {
              productName: string;
              quantitySold: number;
              status: string;
              totalSales: number;
            },
            index: number
          ) => ({
            index: index + 1,
            productName: item.productName,
            quantity: item.quantitySold,
            status: item.status,
            stockValue: formatCurrency(item.totalSales, rate),
          })
        ),
        filename: "Most_Selling_Products",
      },
      inventory: {
        data: inventoryReport.inventorySummary,
        filename: "Inventory_Summary",
      },
    };

    const config = exportConfig[reportType];
    if (config) {
      const formattedColumns = columns
        .filter((col): col is ColumnType<DataType> => "dataIndex" in col)
        .map(({ dataIndex, title }) => ({
          key: dataIndex as string,
          header: title as string,
        }));
      exportToPDF(config.data, config.filename, formattedColumns);
    }
  };

  const handlePrint = () => {
    if (printRef.current && (salesData.length > 0 || bestSellingData.length > 0)) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;

      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
    } else {
    
      toast.error('No Data')
    }
  };
  const paymentMethodsData = Object.entries(salesReport.paymentMethods || {}).map(
    ([method, amount]: any) => ({
      method: method === "none" ? "None" : method.charAt(0).toUpperCase() + method.slice(1),
      amount: parseFloat(amount), 
      formattedAmount: formatCurrency(amount, rate), // For tooltip display
    })
  );
  


  const NoDataMessage = () => (
    <div
      className="flex flex-col justify-center items-center h-full text-[20px] text-gray-500"
    >
      <SmileOutlined style={{ fontSize: 20 }} />
      <p>No data available</p>
    </div>
  );

  const chartDisplay = ({ Data, chartType }: { Data: Array<{ name: string; quantitySold: number; revenue?: number }>, chartType: 'bar' | 'composed' }) => {
    if (!Data || Data.length === 0) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <NoDataMessage />
        </ResponsiveContainer>
      );
    }
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'composed' ? (
          <ComposedChart width={730} height={250} data={Data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <CartesianGrid stroke="#f5f5f5" />
            <Bar
              dataKey="quantitySold"
              name={t("reports.quantitySold")}
              barSize={20}
              fill="#1E3A8A"
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name={t("reports.revenue")}
              stroke="#ff7300"
            />
          </ComposedChart>
        ) : (
          <ComposedChart width={730} height={250} data={Data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <CartesianGrid stroke="#f5f5f5" />
            <Bar
              dataKey="quantitySold"
              name={t("reports.quantitySold")}
              barSize={20}
              fill="#1E3A8A"
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <>
      <div className="grid md:grid-cols-3 grid-cols-1  gap-4">
        <Card
          title={t("reports.totalStock")}
          value={formatCurrency(inventoryReport?.totalStockValue, rate)}
          color="bg-[#FF9F43] bg-opacity-20"
          icon={<PiMoneyLight className="text-[#FF9F43] font-bold" />}
        />
        <Card
          title={t("reports.totalSales")}
          value={formatCurrency(salesReport?.totalSales, rate)}
          color="bg-[#20c997] bg-opacity-20"
          icon={<FaHandHoldingDollar className="text-[#20c997] font-bold" />}
        />
        <Card
          title={t("reports.totalOrders")}
          value={salesReport?.totalOrders}
          color="bg-[#0dcaf0] bg-opacity-20"
          icon={<LiaLuggageCartSolid className="text-[#0dcaf0] font-bold" />}
        />
      </div>
      <div>
     
<PieChart width={300} height={300}>
  <Pie
    data={paymentMethodsData}
    dataKey="amount"
    nameKey="method"
    outerRadius={100}
    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
  >
    {paymentMethodsData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={["#8884d8", "#82ca9d", "#ffc658", "#1a2941"][index % 4]} />
    ))}
  </Pie>
  <Tooltip formatter={(value, name, entry) => entry.payload.formattedAmount} />
  <Legend />
</PieChart>

      </div>

  <div className="mt-5 bg-white dark:bg-[#0e1726] dark:border-0 rounded-md dark:text-dark-light p-2 shadow-sm border flex justify-end gap-5">
    {query === "custom" && (
      <DateRangePicker
        onDateChange={(startDate: Date | null, endDate: Date | null) => {
          if (startDate && endDate) {
            const formattedStart = startDate.toISOString().split("T")[0];
            const formattedEnd = endDate.toISOString().split("T")[0];
            setDateRangeQuery({ startDate: formattedStart, endDate: formattedEnd });
          }
        }}
      />
    )}

    <div className="flex justify-center items-center gap-5">
      <select
        className="block px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value !== "custom") {
            setDateRangeQuery({});
          }
        }}
        value={query}
      >
        <option value="">{t("reports.selectPeriod")}</option>
        <option value="daily">{t("reports.daily")}</option>
        <option value="weekly">{t("reports.weekly")}</option>
        <option value="monthly">{t("reports.monthly")}</option>
        <option value="custom">{t("reports.custom")}</option>
      </select>
      <button onClick={handlePrint} className="btn btn-primary btn-sm text-white px-4 py-2">
        {t("reports.printCharts")}
      </button>
    </div>
  </div>
      <div ref={printRef} className="grid lg:grid-cols-2 gap-5">
        <div className="mt-5 bg-white dark:bg-[#0e1726] dark:border-0 rounded-md dark:text-dark-light p-2 shadow-sm border">
          <h1 className="text-base pl-5 py-5">{t("reports.totalSales")}</h1>
          {chartDisplay({ Data: salesData, chartType: 'composed' })}
        </div>
        <div className="mt-5 bg-white dark:bg-[#0e1726] dark:border-0 rounded-md dark:text-dark-light p-2 shadow-sm border">
          <h1 className="text-base pl-5 py-5">
            {t("reports.bestSellingProduct")}
          </h1>
          {chartDisplay({ Data: bestSellingData, chartType: 'bar' })}
        </div>
      </div>

      <div className="w-full bg-white dark:bg-[#0e1726] dark:border-0 rounded-md dark:text-dark-light p-2 shadow-sm border mt-5">
        <div className="flex justify-between px-5 py-5">
          <h1 className="text-base">{t("reports.lowerStock")}</h1>
          <div className="grid grid-cols-2 grid-flow-col gap-5 text-lg">
            <button
              onClick={() => handleExportToExcel("bestSelling")}
              className="flex items-center justify-center gap-2 btn btn-primary btn-sm"
            >
              <IconFile className="w-5 h-5" />
              <span>{t("reports.exportExcel")}</span>
            </button>
            <button
              onClick={() => handleExportToPdf("bestSelling")}
              className="flex items-center justify-center gap-2 btn btn-primary btn-sm"
            >
              <IconFile className="w-5 h-5" />
              <span>{t("reports.exportPDF")}</span>
            </button>
          </div>
        </div>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={lowerStock}
            onChange={onChange}
            className="dark:dark-table"
            components={{
              header: {
                row: (props: any) => (
                  <tr {...props} className="dark:bg-[#0e1726]" />
                ),
                cell: (props: any) => (
                  <th
                    {...props}
                    className="dark:bg-[#0e1726] dark:text-gray-200"
                  />
                ),
              },
              body: {
                cell: (props: any) => (
                  <td
                    {...props}
                    className="dark:bg-[#0e1726] dark:text-gray-300 dark:border-dark"
                  />
                ),
              },
            }}
            locale={{ emptyText: <Empty description="No Data"/> }}
          />
        </ConfigProvider>
      </div>
      <div className="w-full bg-white dark:bg-[#0e1726] dark:border-0 dark:text-dark-light p-2 shadow-sm border mt-5">
        <div className="flex justify-between px-5 py-5">
          <h1 className="text-base">{t("reports.inventorySummary")}</h1>
          <div className="grid grid-cols-2 grid-flow-col gap-5 text-lg">
            <button
              onClick={() => handleExportToExcel("inventory")}
              className="flex items-center justify-center gap-2 btn btn-primary btn-sm"
            >
              <IconFile className="w-5 h-5" />
              <span>{t("reports.exportExcel")}</span>
            </button>
            <button
              onClick={() => handleExportToPdf("inventory")}
              className="flex items-center justify-center gap-2 btn btn-primary btn-sm"
            >
              <IconFile className="w-5 h-5" />
              <span>{t("reports.exportPDF")}</span>
            </button>
          </div>
        </div>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={inventory}
            onChange={onChange}
            className="dark:dark-table"
            components={{
              header: {
                row: (props: any) => (
                  <tr {...props} className="dark:bg-[#0e1726]" />
                ),
                cell: (props: any) => (
                  <th
                    {...props}
                    className="dark:bg-[#0e1726] dark:text-gray-200"
                  />
                ),
              },
              body: {
                cell: (props: any) => (
                  <td
                    {...props}
                    className="dark:bg-[#0e1726] dark:text-gray-300 dark:border-[#0e1726]"
                  />
                ),
              },
            }}
            locale={{ emptyText: <Empty description="No Data" /> }}
          />
        </ConfigProvider>
      </div>
    </>
  );
};
export default Reports;
