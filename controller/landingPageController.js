import LandingPage from "../model/landingPage.model.js";
import Product from "../model/product.model.js";

// ======================================
// ADMIN: CREATE LANDING PAGE
// ======================================

export const createLandingPage = async (req, res) => {
  try {
    const {
      title,
      slug,
      product,
      template,
      hero,
      video,
      gallery,
      benefits,
      features,
      reviewSection,
      offer,
      faq,
      orderForm,
    } = req.body;

    // check product exists

    const existingProduct = await Product.findById(product);

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // duplicate slug check

    const existingSlug = await LandingPage.findOne({
      slug,
    });

    if (existingSlug) {
      return res.status(400).json({
        message: "Slug already exists",
      });
    }

    const landingPage = await LandingPage.create({
      title,
      slug,
      product,

      template: template || "product-sale-1",

      hero,
      video,
      gallery,
      benefits,
      features,
      reviewSection,
      offer,
      faq,
      orderForm,

      createdBy: req.user?._id,
    });

    res.status(201).json({
      message: "Landing page created successfully",

      landingPage,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create landing page",

      error: error.message,
    });
  }
};

// ======================================
// ADMIN: GET ALL LANDING PAGES
// ======================================

export const getAllLandingPages = async (req, res) => {
  try {
    const pages = await LandingPage.find()
      .populate("product", "productName price productImage")
      .sort({
        createdAt: -1,
      });

    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch landing pages",

      error: error.message,
    });
  }
};

// ======================================
// ADMIN: GET SINGLE LANDING PAGE
// ======================================

export const getLandingPageById = async (req, res) => {
  try {
    const page = await LandingPage.findById(req.params.id).populate("product");

    if (!page) {
      return res.status(404).json({
        message: "Landing page not found",
      });
    }

    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch landing page",

      error: error.message,
    });
  }
};

// ======================================
// PUBLIC: GET BY SLUG
// ======================================

export const getLandingPageBySlug = async (req, res) => {
  try {
    const page = await LandingPage.findOne({
      slug: req.params.slug,

      status: "published",
    }).populate({
      path: "product",

      select:
        "productName price regularPrice productImage details ratingAvg ratingCount delivery",
    });

    if (!page) {
      return res.status(404).json({
        message: "Landing page not found",
      });
    }

    // increase views

    await LandingPage.findByIdAndUpdate(
      page._id,

      {
        $inc: {
          "analytics.views": 1,
        },
      },
    );

    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load landing page",

      error: error.message,
    });
  }
};

// ======================================
// ADMIN: UPDATE LANDING PAGE
// ======================================

// export const updateLandingPage = async (req, res) => {
//   try {
//     const updatedPage = await LandingPage.findByIdAndUpdate(
//       req.params.id,

//       req.body,

//       {
//         new: true,
//         runValidators: true,
//       },
//     );

//     if (!updatedPage) {
//       return res.status(404).json({
//         message: "Landing page not found",
//       });
//     }

//     res.status(200).json({
//       message: "Landing page updated",

//       landingPage: updatedPage,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Update failed",

//       error: error.message,
//     });
//   }
// };


export const updateLandingPage = async (req, res) => {
  try {
    // These fields must only be changed by dedicated APIs.
    const {
      status,
      isHomepage,
      _id,
      createdBy,
      analytics,
      ...safeUpdates
    } = req.body;

    const updatedPage = await LandingPage.findByIdAndUpdate(
      req.params.id,
      { $set: safeUpdates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPage) {
      return res.status(404).json({
        message: "Landing page not found",
      });
    }

    return res.status(200).json({
      message: "Landing page updated",
      landingPage: updatedPage,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
  }
};



// ======================================
// ADMIN: DELETE LANDING PAGE
// ======================================

export const deleteLandingPage = async (req, res) => {
  try {
    const deleted = await LandingPage.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Landing page not found",
      });
    }

    res.status(200).json({
      message: "Landing page deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",

      error: error.message,
    });
  }
};

// ======================================
// ADMIN: PUBLISH / UNPUBLISH
// ======================================


export const updateLandingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "draft",
      "published",
      "inactive",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid landing page status",
      });
    }

    const page = await LandingPage.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        message: "Landing page not found",
      });
    }

    // Only check the limit when publishing a new page.
    if (
      status === "published" &&
      page.status !== "published"
    ) {
      const publishedCount = await LandingPage.countDocuments({
        status: "published",
      });

      if (publishedCount >= 2) {
        return res.status(400).json({
          message:
            "সর্বোচ্চ ২টি Landing Page Published রাখা যাবে। আগে একটি Unpublish করুন।",
        });
      }
    }

    // A draft/inactive page cannot remain homepage.
    page.status = status;

    if (status !== "published") {
      page.isHomepage = false;
    }

    await page.save();

    return res.status(200).json({
      message: "Status updated successfully",
      page,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Status update failed",
      error: error.message,
    });
  }
};





export const getHomepageLandingPage = async (req, res) => {
  try {
    const page = await LandingPage.findOne({
      status: "published",
      isHomepage: true,
    }).populate({
      path: "product",
      select:
        "productName price regularPrice productImage details ratingAvg ratingCount delivery",
    });

    if (!page) {
      return res.status(404).json({
        message: "No homepage selected. Set a published landing page as homepage.",
      });
    }

    await LandingPage.findByIdAndUpdate(page._id, {
      $inc: { "analytics.views": 1 },
    });

    return res.status(200).json(page);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load homepage",
      error: error.message,
    });
  }
};

export const setHomepageLandingPage = async (req, res) => {
  try {
    const page = await LandingPage.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        message: "Landing page not found",
      });
    }

    if (page.status !== "published") {
      return res.status(400).json({
        message: "Only published pages can be set as homepage",
      });
    }

    if (page.isHomepage) {
      return res.status(200).json({
        message: "This page is already the homepage",
        landingPage: page,
      });
    }

    // Clear the old homepage first.
    await LandingPage.updateMany(
      { isHomepage: true },
      { $set: { isHomepage: false } }
    );

    const updated = await LandingPage.findByIdAndUpdate(
      page._id,
      { $set: { isHomepage: true } },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Homepage updated successfully",
      landingPage: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to set homepage",
      error: error.message,
    });
  }
};
