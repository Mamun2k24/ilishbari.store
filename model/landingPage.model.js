import mongoose from "mongoose";

const { Schema } = mongoose;


const landingPageSchema = new Schema(
  {

    // =========================
    // Basic Information
    // =========================

    title: {
      type: String,
      required: true,
      trim: true,
    },


    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },


    // Main product
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },


    // Template system
    template: {
      type: String,
      default: "product-sale-1",
    },


    // draft / published
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "inactive"
      ],
      default: "draft",
      index: true,
    },




    // Visual theme: each landing page may have its own palette.
    theme: {
      primary: { type: String, default: "#153f2d" },
      accent: { type: String, default: "#f59e0b" },
      background: { type: String, default: "#e4f3e9" },
      button: { type: String, default: "#169447" },
      text: { type: String, default: "#142c21" },
    },
    // Content is stored separately from the existing checkout settings.
    content: {
      problemTitle: { type: String, default: "সমস্যা ও সমাধান" },
      problems: [{ type: String, trim: true }],
      solutions: [{ type: String, trim: true }],
      whyTitle: { type: String, default: "কেন আমাদের পণ্য সেরা?" },
      galleryTitle: { type: String, default: "আমাদের গ্যালারি" },
      productTitle: { type: String, default: "আমাদের পণ্য" },
      benefitsTitle: { type: String, default: "মধুর উপকারিতা" },
      videoTitle: { type: String, default: "দেখুন বিস্তারিত" },
      ctaTitle: { type: String, default: "আজই অর্ডার করুন" },
      ctaDescription: { type: String, default: "বিশেষ অফারটি মিস করবেন না" },
      footerText: { type: String, default: "" },
    },
    testimonials: [{
      name: { type: String, default: "" },
      comment: { type: String, default: "" },
      rating: { type: Number, min: 1, max: 5, default: 5 },
    }],

    // =========================
    // Hero Section
    // =========================

    hero: {

      headline: {
        type: String,
        trim: true,
      },


      subHeadline: {
        type: String,
        trim: true,
      },


      image: {
        type: String,
        default: "",
      },


      badge: {
        type: String,
        default: "",
      },


      buttonText: {
        type: String,
        default: "অর্ডার করুন",
      },


      buttonColor: {
        type: String,
        default: "#16a34a",
      },

    },



    // =========================
    // Video Section
    // =========================

    video: {

      enabled: {
        type: Boolean,
        default: false,
      },


      type: {
        type: String,
        enum:[
          "youtube",
          "facebook",
          "upload"
        ],
        default:"youtube",
      },


      url:{
        type:String,
        default:"",
      },


      thumbnail:{
        type:String,
        default:"",
      }

    },



    // =========================
    // Gallery
    // =========================

    gallery:[

      {
        image:{
          type:String,
          required:true,
        },

        title:{
          type:String,
          default:"",
        }

      }

    ],



    // =========================
    // Benefits Section
    // =========================

    benefits:[

      {

        icon:{
          type:String,
          default:"",
        },


        title:{
          type:String,
          trim:true,
        },


        description:{
          type:String,
          trim:true,
        }

      }

    ],



    // =========================
    // Features
    // =========================

    features:[

      {

        title:{
          type:String,
        },


        description:{
          type:String,
        }

      }

    ],




    // =========================
    // Customer Reviews
    // =========================

    reviewSection:{

      enabled:{
        type:Boolean,
        default:true,
      },


      title:{
        type:String,
        default:"আমাদের সন্তুষ্ট গ্রাহকরা",
      }

    },




    // =========================
    // Offer Section
    // =========================

    offer:{

      enabled:{
        type:Boolean,
        default:false,
      },


      title:{
        type:String,
        default:"",
      },


      oldPrice:{
        type:Number,
        default:0,
      },


      offerPrice:{
        type:Number,
        default:0,
      },


      discountText:{
        type:String,
        default:"",
      },


      countdown:{
        type:Date,
        default:null,
      }

    },




    // =========================
    // FAQ
    // =========================

    faq:[

      {

        question:{
          type:String,
        },


        answer:{
          type:String,
        }

      }

    ],




    // =========================
    // Order Form Settings
    // =========================

    orderForm:{

      enabled:{
        type:Boolean,
        default:true,
      },


      quantity:{
        type:Boolean,
        default:true,
      },


      paymentMethod:{
        type:Boolean,
        default:true,
      },


      shipping:{
        type:Boolean,
        default:true,
      }

    },




    // =========================
    // Analytics
    // =========================

    analytics:{

      views:{
        type:Number,
        default:0,
      },


      orders:{
        type:Number,
        default:0,
      },


      conversion:{
        type:Number,
        default:0,
      }

    },


    // admin info
    createdBy:{
      type:Schema.Types.ObjectId,
      ref:"User",
      default:null,
    }


  },

  {
    timestamps:true,
    collection:"landingPages"
  }

);



const LandingPage = mongoose.model(
  "LandingPage",
  landingPageSchema
);


export default LandingPage;