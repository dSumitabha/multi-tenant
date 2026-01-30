const products = [
    {
        name: "Classic Cotton T-Shirt",
        description: "Soft 100% cotton t-shirt for everyday wear.",
        attributes: [
            { name: "Color", values: ["Black", "White", "Navy"] },
            { name: "Size", values: ["S", "M", "L", "XL"] }
        ],
        variants: [
            {
                sku: "TSHIRT-CC-BLK-S",
                attributes: { Color: "Black", Size: "S" },
                price: 199,
                stock: 120,
                reorderLevel: 20
            }
        ]
    },
    {
        name: "Premium Polo Shirt",
        description: "Slim-fit polo shirt with breathable fabric.",
        attributes: [
            { name: "Color", values: ["Blue", "Grey"] },
            { name: "Size", values: ["M", "L", "XL"] }
        ],
        variants: [
            {
                sku: "POLO-PR-BLU-M",
                attributes: { Color: "Blue", Size: "M" },
                price: 299,
                stock: 60,
                reorderLevel: 10
            }
        ]
    },
    {
        name: "Hooded Sweatshirt",
        description: "Warm fleece hoodie for casual and winter wear.",
        attributes: [
            { name: "Color", values: ["Black", "Maroon"] },
            { name: "Size", values: ["M", "L", "XL"] }
        ],
        variants: [
            {
                sku: "HOOD-FL-BLK-L",
                attributes: { Color: "Black", Size: "L" },
                price: 499,
                stock: 40,
                reorderLevel: 8
            }
        ]
    },
    {
        name: "Denim Jeans",
        description: "Regular-fit denim jeans with stretch fabric.",
        attributes: [
            { name: "Color", values: ["Dark Blue", "Light Blue"] },
            { name: "Waist", values: ["30", "32", "34", "36"] }
        ],
        variants: [
            {
                sku: "JEANS-DNM-DB-32",
                attributes: { Color: "Dark Blue", Waist: "32" },
                price: 599,
                stock: 55,
                reorderLevel: 12
            }
        ]
    }
];

export default products;