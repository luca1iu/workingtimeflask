from app_functions import *

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def home():
    country = request.form.get("country")
    region = request.form.get("state")
    gross = float(request.form.get("gross_income", 0))
    net = float(request.form.get("net_income", 0))
    start_time = request.form.get("start_time")
    end_time = request.form.get("end_time")

    if request.method == "POST":
        print(f"Country: {country}, Region: {region}, Gross Income: {gross}, Net Income: {net}, Start Time: {start_time}, End Time: {end_time}")

    return render_template('index.html',country=country,
    region=region,
    gross=gross,
    net=net,
    start_time=start_time,
    end_time=end_time)


@app.route("/<country_code>", methods=["GET", "POST"])
def country_dashboard(country_code):
    print(f"Accessing country dashboard for: {country_code}")
    country_code = country_code.upper()
    country_info = {
        "US": {"name": "United States", "flag": "🇺🇸"},
        "AU": {"name": "Australia", "flag": "🇦🇺"},
        "DE": {"name": "Germany", "flag": "🇩🇪"},
        "GB": {"name": "United Kingdom", "flag": "🇬🇧"},
        "CA": {"name": "Canada", "flag": "🇨🇦"},
    }

    selected_region = None
    holidays_this_month = []
    today = date.today()

    if request.method == "POST":
        selected_region = request.form.get("state")
        print(f"Selected region: {selected_region}")

    return render_template(
        "country.html",
        country_code=country_code,  # <-- 必须加这行
        country_name=country_info[country_code]["name"],
        country_flag=country_info[country_code]["flag"],
        selected_region=selected_region,
        current_month=today.strftime("%B")
    )


if __name__ == "__main__":
    app.run(debug=True)