import api from "../api/api";

export async function uploadLogo(file, companyId) {

    const extension = file.name.split(".").pop();

    const response = await api.post("/uploads", {

        extension,

        content_type: file.type,

        company_id: companyId

    });

    console.log(response.data);

    return response.data.data;   
}