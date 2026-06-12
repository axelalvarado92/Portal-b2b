import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import {
  getCompanies,
} from "../services/companyService";

const CompanyContext = createContext();

export function CompanyProvider({
  children,
}) {

  const [companies, setCompanies] =
    useState([]);

  const [
    selectedCompany,
    setSelectedCompany,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadCompanies() {

      try {

        const response =
          await getCompanies();

        const companyList =
          response.data || [];

        console.log(
          "COMPANY LIST:",
          companyList
        );  

        setCompanies(companyList);

        if (
          companyList.length > 0
        ) {

          console.log(
            "SETTING COMPANY:",
            companyList[0]
          );

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

  }, []);

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