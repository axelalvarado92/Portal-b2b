import { useAuth }
  from "../context/AuthContext";

import DashboardAdmin
  from "./admin/DashboardAdmin";

import DashboardCustomer
  from "./customer/DashboardCustomer";

export default function Dashboard() {

  const { user } = useAuth();

  if (
    user?.role === "admin"
  ) {

    return <DashboardAdmin />;

  }

  return (
    <DashboardCustomer />
  );

}