import Soup from "gi://Soup";
import GLib from "gi://GLib";

export async function getRestaurantMenus() {
  const apiUrl = "https://skinfo.dy.fi/api/restaurants.json";
  const session = new Soup.Session();
  const message = Soup.Message.new("GET", apiUrl);

  const formattedItems = {};

  try {
    const bytes = await session.send_and_read_async(
      message,
      GLib.PRIORITY_DEFAULT,
      null,
    );

    // convert binary to a string and parse the JSON to an object
    const decoder = new TextDecoder();
    const data = JSON.parse(decoder.decode(bytes.get_data()));
    const todayISO = new Date().toISOString().slice(0, 10);

    // Parsing the menus
    Object.entries(data).forEach((entry) => {
      const restaurantObj = entry[1];
      let restaurantName = restaurantObj.name;

      formattedItems[restaurantName] = [];

      if (restaurantObj["days"].length == 0) {
        formattedItems[restaurantName].push({
          category: "Error",
          title: "No menu for today",
        });
      } else {
        if (!restaurantObj["days"][todayISO]) {
          formattedItems[restaurantName].push({
            category: "Error",
            title: "No menu for today",
          });
        } else {
          let tempMenu = restaurantObj["days"][todayISO]["foods"];
          for (let item of tempMenu) {
            formattedItems[restaurantName].push({
              category: item.category,
              title: item.title_fi,
            });
          }
        }
      }
    });
    return formattedItems;
  } catch (e) {
    console.error("Failed to fetch menu:", e);
    return formattedItems;
  }
}
