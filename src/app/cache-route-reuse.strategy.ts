import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";
import { getListSections } from "../utils/Constants";

export class CustomReuseStrategy implements RouteReuseStrategy {
  /**
   * Custom implementation of the RouteReuseStrategy interface in Angular.
   * Determines whether a route should be reused or not based on certain conditions.
   */

  /**
   * A set of route paths that should be cached for reuse.
   */
  routesToCache: Set<string> = new Set(getListSections());

  /**
   * A map that stores the detached route handles for each route's path.
   */
  storedRouteHandles = new Map<string, DetachedRouteHandle>();

  /**
   * Determines whether a route should be detached and stored for later reuse.
   * @param route - The route to check.
   * @returns A boolean indicating whether the route should be detached and stored.
   */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.path ? this.routesToCache.has(route.routeConfig.path) : false;
  }

  /**
   * Stores the detached route handle for a given route's path.
   * @param route - The route to store the handle for.
   * @param handle - The detached route handle to store.
   */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (route.routeConfig?.path) {
      this.storedRouteHandles.set(route.routeConfig.path, handle);
    }
  }

  /**
   * Determines whether a route should be attached and retrieved from the stored route handles.
   * @param route - The route to check.
   * @returns A boolean indicating whether the route should be attached and retrieved.
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.path ? this.storedRouteHandles.has(route.routeConfig.path) : false;
  }

  /**
   * Retrieves the detached route handle for a given route's path.
   * @param route - The route to retrieve the handle for.
   * @returns The detached route handle or null if not found.
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return route.routeConfig?.path ? this.storedRouteHandles.get(route.routeConfig.path) || null : null;
  }

  /**
   * Determines whether a future route should be reused based on the current route.
   * @param future - The future route.
   * @param curr - The current route.
   * @returns A boolean indicating whether the future route should be reused.
   */
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}