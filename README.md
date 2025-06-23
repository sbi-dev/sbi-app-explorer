# SBI application explorer
<img width="1355" alt="image" src="https://github.com/user-attachments/assets/c8e4a0e4-73c0-40ea-ae2d-a6a0cb46f092" />

About the SBI application explorer
----------------------------------
The SBI application explorer shows how SBI is applied across different research fields and data types, in particular with respect to the number of parameters and the number of simulations used. This is to gain a quick overview over existing applications, and the right settings for your own work.

What we track
-------------
For each SBI application, we collect the following information:

**Core SBI Parameters**
- Number of simulations (simulation budget used for training)
- Number of parameters (dimensionality of θ)
- Data dimensionality (dimensionality of x, when reported)
- Data type (summary statistics, time series, images, etc.)

**Implementation Details**
- Method (SNPE, SNLE, SNRE, NPE, NLE, NRE, ABC variants, etc.)
- Toolbox (`sbi`, custom code, or other packages)

**Context & Resources**
- Research area (neuroscience, cosmology, biology, etc.)
- Task name (brief identifier for the inference problem)
- Task description of the task
- Paper title, URL, and GitHub repository (when available)

App Features
------------
- Filter by research area, data type, SBI method, or toolbox
- Search for specific papers
- Hover over data points to show paper details
- Toggle labels and adjust marker size based on data dimensionality

Contributing
-----------
The data comes from a curated list of SBI papers.
You can submit new applications through our 
[submission form](https://docs.google.com/forms/d/e/1FAIpQLSeu7Er272IKAnTxBX6osqcbrdvG2ny-aIybv6FDIFLLe8SSoA/viewform).
Contributions for improving the web application and general workflow are welcome.
