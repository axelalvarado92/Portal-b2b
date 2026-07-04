import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import {
  getCompanies,
} from "../services/companyService";

import { useAuth } from "./AuthContext";

const CompanyContext = createContext();

export function CompanyProvider({
  children,
}) {

  const { isAuthenticated } = useAuth(); // ajustá el nombre según lo que exponga tu AuthContext

  const [companies, setCompanies] =
    useState([]);

  const [
    selectedCompany,
    setSelectedCompany,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    if (!isAuthenticated) {
      setCompanies([]);
      setSelectedCompany(null);
      setLoading(false);
      return;
    }

    async function loadCompanies() {

      try {

        setLoading(true);

        const response =
          await getCompanies();

        const companyList =
          response.data || [];

        setCompanies(companyList);

        if (
          companyList.length > 0
        ) {

          setSelectedCompany(
            companyList[0]
          );

        }

      } catch (err) {

        console.error(
          "COMPANY ERROR",
          err
        );

      } finally {

        setLoading(false);

      }

    }

    loadCompanies();

  }, [isAuthenticated]); // ← clave: ahora reacciona al login/logout

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        setSelectedCompany,
        loading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(
    CompanyContext
  );
}