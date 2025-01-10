<div class="row">
                <!-- Filters Sidebar -->
                <aside class="col-lg-3 col-md-4 col-12 position-fixed sticky-aside bg-light p-4">
                    <h5 class="px-4 mb-3">Filters</h5>
                    <hr>
                    
                    <div id="variantFilter" class="variant-filter filter-section d-flex flex-column flex-wrap gap-1 px-4 mb-4">
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 variant-checkbox" value="128GB"> 128GB
                        </label>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 variant-checkbox" value="256GB"> 256GB
                        </label>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 variant-checkbox" value="512GB"> 512GB
                        </label>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 variant-checkbox" value="1TB"> 1TB
                        </label>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 variant-checkbox" value="2TB"> 2TB
                        </label>
                    </div>

                    <div id="categoryFilter" class="category-filter filter-section d-flex flex-column flex-wrap gap-1 px-4 mb-4">
                        <h6>Category</h6>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 category-checkbox" value="MacBook Pro"> MacBook Pro
                        </label>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 category-checkbox" value="MacBook Air"> MacBook Air
                        </label>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 category-checkbox" value="Mac MINI"> Mac Mini
                        </label>
                        <label class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2 category-checkbox" value="iMac"> iMac
                        </label>
                    </div>
                    
                    
                    
                 


                    <form id="priceSearch" action="#" method="GET">
                        <div class="px-4 mb-4" id="priceFilterContainer">
                            <h6>Price</h6>
                            <div>
                                <input type="checkbox" class="priceRange-checkbox" id="0-10000" name="priceRange"
                                value="0-10000" >
                            <label for="0-10000">₹0 - ₹10,000</label>
                            </div>
                            <div>
                                <input type="checkbox" class="priceRange-checkbox" id="10000-20000" name="priceRange"
                                    value="10000-20000" >
                                <label for="10000-20000">₹10,000 - ₹20,000</label>
                            </div>
                            <div>
                                <input type="checkbox" class="priceRange-checkbox" id="20000-100000" name="priceRange"
                                    value="20000-100000" >
                                <label for="20000-100000">₹20,000 - ₹1,00,000</label>
                            </div>
                            <div>
                                <input type="checkbox" class="priceRange-checkbox" id="100000-150000" name="priceRange"
                                    value="100000-150000">
                                <label for="100000-150000">₹1,00,000 - ₹1,50,000</label>
                            </div>
                            <div>
                                <input type="checkbox" class="priceRange-checkbox" id="150000-175000" name="priceRange"
                                    value="150000-175000" >
                                <label for="150000-175000">₹150,000 - ₹175,000</label>
                            </div>
                            <div>
                                <input type="checkbox" class="priceRange-checkbox" id="175000-200000" name="priceRange"
                                    value="175000-200000" >
                                <label for="175000-200000">₹175,000 - ₹2,00,000</label>
                            </div>
                        </div>
                    </form>


                </aside>

               <main class="col-lg-9 col-md-8 offset-lg-3 offset-md-4">
                    <div class="d-flex justify-content-between align-items-center my-4 p-2 rounded shadow-lg">
                        <div class="d-flex flex-fill">
                            <form id="searchForm" class="d-flex w-100">
                                <input type="text" id="searchInput" class="form-control me-2" placeholder="Search products">
                                <button type="submit" class="btn btn-dark px-3">Search</button>
                            </form>
                        </div>
                        <select id="sortSelect" class="form-select w-auto mx-3 px-5 bg-light">
                            <option value="new">New Product</option>
                            <option value="lowToHigh">Price (Low to High)</option>
                            <option value="highToLow">Price (High to Low)</option>
                            <option value="aToZ">Aa-Zz</option>
                            <option value="zToA">Zz-Aa</option>
                        </select>
                    </div>
                
                    <div id="productsContainer" class="row g-4"></div>
                
                    <nav class="d-flex justify-content-end m-3">
                        <ul id="pagination" class="pagination pagination-mb mb-0"></ul>
                    </nav>
                    
                    
                </main>
                
            </div>