document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const dataTable = document.getElementById("dataTable");
  const deleteSelectedButton = document.getElementById("deleteSelectedButton");
  const bulkDeleteButton = document.getElementById("bulkDeleteButton");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  let data = [];
  let filteredData = [];
  let selectedRows = new Set();
  let headerAdded = false;

  let currentPage = 1;
  const rowsPerPage = 10;
  let totalPages = 0;

  const apiEndpoint =
    "https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json";

  fetch(apiEndpoint)
    .then((response) => response.json())
    .then((apiData) => {
      data = apiData;
      filteredData = [...data];
      populateTable();
    })
    .catch((error) => console.error("Error fetching data:", error));

  searchButton.addEventListener("click", function () {
    performSearch();
  });

  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  bulkDeleteButton.addEventListener("click", function () {
    bulkDeleteRows();
  });

  dataTable.addEventListener("click", function (event) {
    const target = event.target;
    const row = target.closest("tr");

    if (target.classList.contains("edit-btn")) {
      editRow(row);
    } else if (target.classList.contains("delete-btn")) {
      deleteRow(row);
    } else if (target.type === "checkbox") {
      toggleRowSelection(row);
    }
  });

  deleteSelectedButton.addEventListener("click", function () {
    deleteSelectedRows();
  });

  selectAllCheckbox.addEventListener("change", function () {
    selectAllRows(this.checked);
  });

  function populateTable() {
    clearTable();

    const headers = ["Select"].concat(Object.keys(filteredData[0]), "Actions");

    if (!headerAdded) {
      addHeaderRow(headers);
      headerAdded = true;
    }

    totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    filteredData.slice(start, end).forEach((item, index) => {
      addDataRow(item, index + start);
    });

    updatePaginationDisplay();
  }

  function addHeaderRow(headers) {
    const headerRow = dataTable.insertRow();
    headers.forEach((header) => {
      const cell = headerRow.insertCell();
      cell.textContent = header;
    });
  }

  function addDataRow(item, index) {
    const row = dataTable.insertRow();

    const checkboxCell = row.insertCell();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkboxCell.appendChild(checkbox);

    Object.keys(item).forEach((header) => {
      const cell = row.insertCell();
      cell.textContent = item[header];
    });

    const actionsCell = row.insertCell();
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("edit-btn");
    actionsCell.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-btn");
    actionsCell.appendChild(deleteButton);

    row.setAttribute("data-index", index);
  }

  function updatePaginationDisplay() {
    const paginationDiv = document.getElementById("paginationDiv");
    paginationDiv.innerHTML = "";

    const firstPageButton = createPaginationButton("First", "first-page", 1);
    const prevPageButton = createPaginationButton(
      "Previous",
      "previous-page",
      Math.max(1, currentPage - 1)
    );
    const nextPageButton = createPaginationButton(
      "Next",
      "next-page",
      Math.min(totalPages, currentPage + 1)
    );
    const lastPageButton = createPaginationButton(
      "Last",
      "last-page",
      totalPages
    );

    paginationDiv.appendChild(firstPageButton);
    paginationDiv.appendChild(prevPageButton);
    for (let i = 1; i <= totalPages; i++) {
      const pageButton = createPaginationButton(i, "page-number", i);
      if (i === currentPage) {
        pageButton.classList.add("active-page"); 
      }
      paginationDiv.appendChild(pageButton);
    }
    paginationDiv.appendChild(nextPageButton);
    paginationDiv.appendChild(lastPageButton);
  }

  function createPaginationButton(text, className, pageNum) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add(className);
    button.addEventListener("click", function () {
      currentPage = pageNum;
      populateTable();
    });
    return button;
  }

  function editRow(row) {
    const index = row.getAttribute("data-index");
    const headers = Object.keys(data[0]);

    headers.forEach((header, i) => {
      const cell = row.cells[i + 1];
      const newValue = prompt(`Edit ${header}:`, cell.textContent);
      if (newValue !== null) {
        data[index][header] = newValue;
        cell.textContent = newValue;
      }
    });
  }

  function deleteRow(row) {
    const index = row.getAttribute("data-index");
    data.splice(index, 1);
    dataTable.deleteRow(row.rowIndex);
  }

  function toggleRowSelection(row) {
    const dataIndex = row.getAttribute("data-index");
    if (selectedRows.has(dataIndex)) {
        selectedRows.delete(dataIndex);
        row.classList.remove("selected-row");
    } else {
        selectedRows.add(dataIndex);
        row.classList.add("selected-row");
    }
    selectAllCheckbox.checked = Array.from(dataTable.rows)
      .slice(1)
      .every((row) => row.classList.contains("selected-row"));
}

  function selectAllRows(select) {
    Array.from(dataTable.rows)
      .slice(1)
      .forEach((row) => {
        const index = row.getAttribute("data-index");
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.checked = select;

        if (select) {
          selectedRows.add(index);
          row.classList.add("selected-row");
        } else {
          selectedRows.delete(index);
          row.classList.remove("selected-row");
        }
      });
  }

  function deleteSelectedRows() {
    const indicesToDelete = Array.from(selectedRows).sort((a, b) => b - a);
    indicesToDelete.forEach(index => {
        data.splice(index, 1);
    });

    selectedRows.clear();
    filteredData = [...data]; 
    currentPage = 1; 
    populateTable();
}

  function clearTable() {
    while (dataTable.rows.length > 1) {
      dataTable.deleteRow(1);
    }
  }

  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    filteredData = data.filter((item) =>
      Object.values(item).some((val) =>
        val.toString().toLowerCase().includes(searchTerm)
      )
    );
    currentPage = 1;
    populateTable();
  }

  function bulkDeleteRows() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    data = data.filter((_, index) => index < start || index >= end);
    
    filteredData = [...data];
    currentPage = Math.min(currentPage, Math.ceil(data.length / rowsPerPage)) || 1;
    populateTable();
}
});
